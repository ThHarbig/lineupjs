import {getAllToolbarActions, isSupportType} from '../model/annotations';
import Column from '../model/Column';
import {default as CompositeColumn, IMultiLevelColumn} from '../model/CompositeColumn';
import ADialog, { IDialogContext } from '../ui/dialogs/ADialog';
import ChangeRendererDialog from '../ui/dialogs/ChangeRendererDialog';
import MoreColumnOptionsDialog from '../ui/dialogs/MoreColumnOptionsDialog';
import RenameDialog from '../ui/dialogs/RenameDialog';
import BooleanFilterDialog from './dialogs/BooleanFilterDialog';
import CategoricalFilterDialog from './dialogs/CategoricalFilterDialog';
import CategoricalMappingFilterDialog from './dialogs/CategoricalMappingFilterDialog';
import CompositeChildrenDialog from './dialogs/CompositeChildrenDialog';
import CutOffHierarchyDialog from './dialogs/CutOffHierarchyDialog';
import EditPatternDialog from './dialogs/EditPatternDialog';
import MappingsFilterDialog from './dialogs/MappingsFilterDialog';
import ReduceDialog from './dialogs/ReduceDialog';
import ScriptEditDialog from './dialogs/ScriptEditDialog';
import SearchDialog from './dialogs/SearchDialog';
import SortDateDialog from './dialogs/SortDateDialog';
import SortDialog from './dialogs/SortDialog';
import SortGroupDialog from './dialogs/SortGroupDialog';
import StratifyThresholdDialog from './dialogs/StratifyThresholdDialog';
import StringFilterDialog from './dialogs/StringFilterDialog';
import WeightsEditDialog from './dialogs/WeightsEditDialog';
import {IRankingHeaderContext} from './interfaces';

export interface IUIOptions {
  shortcut: boolean;
  order: number;
}

export interface IOnClickHandler {
  (col: Column, evt: { stopPropagation: () => void, currentTarget: Element, [key: string]: any }, ctx: IRankingHeaderContext, level: number): any;
}

export interface IToolbarAction {
  title: string;

  onClick: IOnClickHandler;

  options: Partial<IUIOptions>;
}

export interface IDialogClass {
  new(col: any, dialog: IDialogContext, ...args: any[]): ADialog;
}

function ui(title: string, onClick: IOnClickHandler, options: Partial<IUIOptions> = {}): IToolbarAction {
  return {title, onClick, options};
}

function dialogContext(ctx: IRankingHeaderContext, level: number, evt: { currentTarget: Element}): IDialogContext {
  return {
    attachment: <HTMLElement>evt.currentTarget,
    level,
    manager: ctx.dialogManager
  };
}

function uiDialog(title: string, dialogClass: IDialogClass, extraArgs: ((ctx: IRankingHeaderContext) => any[]) = () => [], options: Partial<IUIOptions> = {}): IToolbarAction {
  return {
    title,
    onClick: (col, evt, ctx, level) => {
      const dialog = new dialogClass(col, dialogContext(ctx, level, evt), ... extraArgs(ctx));
      dialog.open();
    }, options
  };
}

const sort: IToolbarAction = {
  title: 'Sort',
  onClick: (col, _evt, ctx, level) => {
    ctx.dialogManager.removeAboveLevel(level);
    col.toggleMySorting();
  },
  options: {
    shortcut: true,
    order: 1
  }
};

const rename: IToolbarAction = {
  title: 'Rename + Color &hellip;',
  onClick: (col, evt, ctx, level) => {
    const dialog = new RenameDialog(col, dialogContext(ctx, level, evt));
    dialog.open();
  },
  options: {
    order: 3
  }
};

const vis: IToolbarAction = {
  title: 'Visualization &hellip;',
  onClick: (col, evt, ctx, level) => {
    const dialog = new ChangeRendererDialog(col, dialogContext(ctx, level, evt), ctx);
    dialog.open();
  },
  options: {}
};

const clone: IToolbarAction = {
  title: 'Clone',
  onClick: (col, _evt, ctx, level) => {
    ctx.dialogManager.removeAboveLevel(level);
    ctx.provider.takeSnapshot(col);
  },
  options: {
    order: 80
  }
};

const more: IToolbarAction = {
  title: 'More &hellip;',
  onClick: (col, evt, ctx, level) => {
    const dialog = new MoreColumnOptionsDialog(col, dialogContext(ctx, level, evt), ctx);
    dialog.open();
  },
  options: {
    shortcut: true,
    order: 3
  }
};

const remove: IToolbarAction = {
  title: 'Remove',
  onClick: (col, _evt, ctx, level) => {
    ctx.dialogManager.removeAboveLevel(level);
    if (col.desc.type !== 'rank') {
      col.removeMe();
      return;
    }
    ctx.provider.removeRanking(col.findMyRanker()!);
    ctx.provider.ensureOneRanking();
  },
  options: {
    order: 90
  }
};

const stratify = ui('Stratify', (col, _evt, ctx, level) => {
  ctx.dialogManager.removeAboveLevel(level);
  col.groupByMe();
}, { shortcut: true, order: 2});

const collapse = ui('Compress', (col, evt, ctx, level) => {
  ctx.dialogManager.removeAboveLevel(level);
  const mcol = <IMultiLevelColumn>col;
  mcol.setCollapsed(!mcol.getCollapsed());
  const i = <HTMLElement>evt.currentTarget;
  i.title = mcol.getCollapsed() ? 'Expand' : 'Compress';
});

export const toolbarActions: { [key: string]: IToolbarAction } = {
  stratify,
  collapse,
  sort,
  more,
  clone,
  remove,
  rename,
  vis,
  search: uiDialog('Search &hellip;', SearchDialog, (ctx) => [ctx.provider]),
  sortNumbers: uiDialog('Sort by &hellip;', SortDialog),
  sortDates: uiDialog('Sort by &hellip;', SortDateDialog),
  sortNumbersGroup: uiDialog('Sort Group by &hellip;', SortDialog),
  sortGroup: uiDialog('Sort Group by &hellip;', SortGroupDialog, () => [], {shortcut: true, order: 1}),
  stratifyThreshold: uiDialog('Stratify by Threshold &hellip;', StratifyThresholdDialog, () => [], {
    shortcut: true,
    order: 2
  }),
  filterMapped: uiDialog('Filter &hellip;', MappingsFilterDialog, (ctx) => [ctx]),
  filterString: uiDialog('Filter &hellip;', StringFilterDialog),
  filterCategorical: uiDialog('Filter &hellip;', CategoricalFilterDialog),
  filterOrdinal: uiDialog('Filter &hellip;', CategoricalMappingFilterDialog),
  filterBoolean: uiDialog('Filter &hellip;', BooleanFilterDialog),
  script: uiDialog('Edit Combine Script &hellip;', ScriptEditDialog),
  reduce: uiDialog('Reduce by &hellip;', ReduceDialog),
  cutoff: uiDialog('Set Cut Off &hellip;', CutOffHierarchyDialog, (ctx) => [ctx.idPrefix]),
  editPattern: uiDialog('Edit Pattern &hellip;', EditPatternDialog, (ctx) => [ctx.idPrefix]),
  editWeights: uiDialog('Edit Weights &hellip;', WeightsEditDialog),
  compositeContained: uiDialog('Contained Columns &hellip;', CompositeChildrenDialog, (ctx) => [ctx]),
  splitCombined: ui('Split Combined Column', (col, _evt, ctx, level) => {
    ctx.dialogManager.removeAboveLevel(level);
    // split the combined column into its children
    (<CompositeColumn>col).children.reverse().forEach((c) => col.insertAfterMe(c));
    col.removeMe();
  })
};

const cache = new Map<string, IToolbarAction[]>();

export default function getToolbar(col: Column, ctx: IRankingHeaderContext) {
  if (cache.has(col.desc.type)) {
    return cache.get(col.desc.type)!;
  }
  const icons = ctx.toolbar;
  const actions = new Set<IToolbarAction>();
  actions.add(remove);
  actions.add(more);

  {
    const possible = ctx.getPossibleRenderer(col);
    if (possible.item.length > 2 || possible.group.length > 2 || possible.summary.length > 2) { // default always possible
      actions.add(vis);
    }
  }

  if (!isSupportType(col)) {
    actions.add(sort);
    actions.add(rename);
    actions.add(clone);
  }

  const keys = getAllToolbarActions(col);

  keys.forEach((key) => {
    if (icons.hasOwnProperty(key)) {
      actions.add(icons[key]);
    } else {
      console.warn('cannot find: ', col.desc.type, key);
    }
  });

  const r = Array.from(actions).sort((a, b) => {
    if (a.options.order === b.options.order) {
      return a.title.localeCompare(b.title);
    }
    return (a.options.order || 50) - (b.options.order || 50);
  });
  cache.set(col.desc.type, r);
  return r;
}
