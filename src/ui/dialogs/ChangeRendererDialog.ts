import Column from '../../model/Column';
import {IRankingHeaderContext} from '../interfaces';
import ADialog, {IDialogContext} from './ADialog';

/** @internal */
export default class ChangeRendererDialog extends ADialog {
  constructor(private readonly column: Column, dialog: IDialogContext, private readonly ctx: IRankingHeaderContext) {
    super(dialog);
  }

  protected build(node: HTMLElement) {
    const current = this.column.getRenderer();
    const currentGroup = this.column.getGroupRenderer();
    const currentSummary = this.column.getSummaryRenderer();
    const {item, group, summary} = this.ctx.getPossibleRenderer(this.column);

    console.assert(item.length > 1 || group.length > 1 || summary.length > 1); // otherwise no need to show this

    node.insertAdjacentHTML('beforeend', `
      ${item.map((d) => `<label><input type="radio" name="renderer" value=${d.type}  ${(current === d.type) ? 'checked' : ''}> ${d.label}</label>`).join('')}
      <strong>Group Visualization</strong>
      ${group.map((d) => `<label><input type="radio" name="group" value=${d.type}  ${(currentGroup === d.type) ? 'checked' : ''}> ${d.label}</label>`).join('')}
      <strong>Summary Visualization</strong>
      ${summary.map((d) => `<label><input type="radio" name="summary" value=${d.type}  ${(currentSummary === d.type) ? 'checked' : ''}> ${d.label}</label>`).join('')}
    `);
    Array.from(node.querySelectorAll('input[name="renderer"]')).forEach((n: HTMLInputElement) => {
      n.addEventListener('change', () => this.column.setRenderer(n.value));
    });
    Array.from(node.querySelectorAll('input[name="group"]')).forEach((n: HTMLInputElement) => {
      n.addEventListener('change', () => this.column.setGroupRenderer(n.value));
    });
    Array.from(node.querySelectorAll('input[name="summary"]')).forEach((n: HTMLInputElement) => {
      n.addEventListener('change', () => this.column.setSummaryRenderer(n.value));
    });
  }

}
