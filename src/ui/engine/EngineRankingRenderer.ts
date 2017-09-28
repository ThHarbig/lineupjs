/**
 * Created by Samuel Gratzl on 18.07.2017.
 */
import {ACellRenderer, ICellRenderContext, nonUniformContext} from 'lineupengine/src';
import RenderColumn from './RenderColumn';
import {IRankingContext, IRankingHeaderContext} from './interfaces';
import {IExceptionContext} from 'lineupengine/src/logic';
import MultiLevelRenderColumn from './MultiLevelRenderColumn';
import {debounce} from '../../utils';
import StackColumn from '../../model/StackColumn';
import Column from '../../model/Column';
import {IDOMRenderContext} from '../../renderer/RendererContexts';

export default class EngineRankingRenderer extends ACellRenderer<RenderColumn> {
  protected _context: ICellRenderContext<RenderColumn>;

  private initialized: 'ready'|'waiting'|'no' = 'no';

  constructor(root: HTMLElement, id: string, private readonly ctx: IRankingHeaderContext & IDOMRenderContext, private readonly extraRowUpdate?: (row: HTMLElement, rowIndex: number) => void) {
    super(root, `#${id}`);
    root.id = id;
  }

  protected get context() {
    return this._context;
  }

  protected createHeader(document: Document, column: RenderColumn) {
    if (column instanceof MultiLevelRenderColumn) {
      column.updateWidthRule(this.style);
    }
    return column.createHeader(document, this.ctx);
  }

  protected updateHeader(node: HTMLElement, column: RenderColumn) {
    if (column instanceof MultiLevelRenderColumn) {
      column.updateWidthRule(this.style);
    }
    return column.updateHeader(node, this.ctx);
  }

  protected createCell(document: Document, index: number, column: RenderColumn) {
    return column.createCell(index, document, this.ctx);
  }

  protected updateCell(node: HTMLElement, index: number, column: RenderColumn) {
    return column.updateCell(node, index, this.ctx);
  }

  updateHeaders() {
    if (!this._context) {
      return;
    }
    super.updateHeaders();
  }

  updateHeaderOf(i: number) {
    const node = <HTMLElement>this.header.children[i]!;
    const column = this._context.columns[i];
    if (column instanceof MultiLevelRenderColumn) {
      column.updateWidthRule(this.style);
    }
    this.updateHeader(node, column);
  }

  protected createRow(node: HTMLElement, rowIndex: number, ...extras: any[]): void {
    super.createRow(node, rowIndex, ...extras);
    const isGroup = this.ctx.isGroup(rowIndex);

    if (this.extraRowUpdate) {
      this.extraRowUpdate(node, rowIndex);
    }

    if (isGroup) {
      node.dataset.agg = 'group';
      return;
    }

    const dataIndex = this.ctx.getRow(rowIndex).dataIndex;
    node.dataset.dataIndex = dataIndex.toString();
    node.dataset.agg = 'detail'; //or 'group'
    if (this.ctx.provider.isSelected(dataIndex)) {
      node.classList.add('lu-selected');
    } else {
      node.classList.remove('lu-selected');
    }
    node.onclick = (evt) => {
      const dataIndex = parseInt(node.dataset.dataIndex!, 10);
      this.ctx.provider.toggleSelection(dataIndex, evt.ctrlKey);
    };
  }

  protected updateRow(node: HTMLElement, rowIndex: number, ...extras: any[]): void {
    const isGroup = this.ctx.isGroup(rowIndex);
    const wasGroup = node.dataset.agg === 'group';

    if (this.extraRowUpdate) {
      this.extraRowUpdate(node, rowIndex);
    }

    if (isGroup !== wasGroup) {
      // change of mode clear the children to reinitialize them
      node.innerHTML = '';

      // adapt body
      node.dataset.agg = isGroup ? 'group' : 'detail';
      if (isGroup) {
        node.dataset.dataIndex = '';
        node.onclick = <any>undefined;
      } else {
        node.onclick = (evt) => {
          const dataIndex = parseInt(node.dataset.dataIndex!, 10);
          this.ctx.provider.toggleSelection(dataIndex, evt.ctrlKey);
        };
      }
    }

    if (!isGroup) {
      const dataIndex = this.ctx.getRow(rowIndex).dataIndex;
      node.dataset.dataIndex = dataIndex.toString();
      if (this.ctx.provider.isSelected(dataIndex)) {
        node.classList.add('lu-selected');
      } else {
        node.classList.remove('lu-selected');
      }
    }

    super.updateRow(node, rowIndex, ...extras);
  }

  updateSelection(dataIndices: number[]) {
    const selected = new Set(dataIndices);
    this.forEachRow((node: HTMLElement) => {
      const dataIndex = parseInt(node.dataset.dataIndex!, 10);
      if (selected.has(dataIndex)) {
        node.classList.add('lu-selected');
      } else {
        node.classList.remove('lu-selected');
      }
    }, true);
  }

  getStyleManager() {
    return this.style;
  }

  updateColumnWidths() {
    const context = this.context;
    this.style.update(context.defaultRowHeight, context.columns, context.column.defaultRowHeight);
    //no data update needed since just width changed
    context.columns.forEach((column) => {
      if (column instanceof MultiLevelRenderColumn) {
        column.updateWidthRule(this.style);
      }
    });
  }

  private updateColumn(index: number) {
    const column = this._context.columns[index];
    this.forEachRow((row, rowIndex) => {
      this.updateCell(<HTMLElement>row.children[index], rowIndex, column);
    });
  }

  setZoomFactor(zoomFactor: number) {
    if (this.initialized !== 'ready') {
      return;
    }
    this.body.style.fontSize = `${zoomFactor * 100}%`;
  }

  destroy() {
    this.root.remove();

    this._context.columns.forEach((c) => {
      c.c.on(`${Column.EVENT_WIDTH_CHANGED}.body`, null);
      if (!(c instanceof MultiLevelRenderColumn)) {
        return;
      }
      c.c.on(`${StackColumn.EVENT_MULTI_LEVEL_CHANGED}.body`, null);
      c.c.on(`${StackColumn.EVENT_MULTI_LEVEL_CHANGED}.bodyUpdate`, null);
    });
  }

  render(columns: RenderColumn[], rowContext: IExceptionContext) {
    this._context = Object.assign({
      columns,
      column: nonUniformContext(columns.map((w) => w.width), 100)
    }, rowContext);

    columns.forEach((c, i) => {
      c.c.on(`${Column.EVENT_WIDTH_CHANGED}.body`, () => {
        this.updateColumnWidths();
      });
      if (!(c instanceof MultiLevelRenderColumn)) {
        return;
      }
      c.c.on(`${StackColumn.EVENT_MULTI_LEVEL_CHANGED}.body`, () => {
        c.updateWidthRule(this.getStyleManager());
      });
      c.c.on(`${StackColumn.EVENT_MULTI_LEVEL_CHANGED}.bodyUpdate`, debounce(() => this.updateColumn(i), 25));
    });

    if (this.initialized === 'ready') {
      super.recreate();
    } else if (this.initialized !== 'waiting') {
      this.initialized = 'waiting';
      setTimeout(() => {
          super.init();
          this.initialized = 'ready';
        }, 100);
    }
  }

  fakeHover(dataIndex: number) {
    const old = this.body.querySelector(`[data-data-index].lu-hovered`);
    if (old) {
      old.classList.remove('lu-hovered');
    }
    const item = this.body.querySelector(`[data-data-index="${dataIndex}"]`);
    if (item) {
      item.classList.add('lu-hovered');
    }
  }
}
