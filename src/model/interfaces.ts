import Column from './Column';
import Ranking from './Ranking';
import CompositeColumn from './CompositeColumn';

export interface IStyleColumn {
  /**
   * column description
   */
  description: string;

  /**
   * color of this column
   * @deprecated not used anymore
   */
  color: string;

  /**
   * frozen column
   * @default isSupportType
   */
  frozen: boolean;

  /**
   * whether the column can be removed or not
   * @default false
   */
  fixed: boolean;

  /**
   * default renderer to use
   */
  renderer: string;

  /**
   * default group renderer to use
   */
  groupRenderer: string;

  /**
   * default summary renderer to use
   */
  summaryRenderer: string;

  /**
   * initial width of the column
   * @default 100 or 200 for strings
   */
  width: number;

  /**
   * is this column visible by default
   * @default true
   */
  visible: boolean;
}

/**
 * default color that should be used
 * @type {string}
 */
export const DEFAULT_COLOR = '#C1C1C1';


export interface IColumnDesc extends Partial<IStyleColumn> {
  /**
   * label of the column
   */
  label: string;
  /**
   * the column type
   */
  type: string;
}

export interface IValueColumnDesc<T> extends IColumnDesc {
  /**
   * is the data lazy loaded and not yet available
   * @default false
   */
  lazyLoaded?: boolean;

  /**
   * value accessor of this column
   * @param row the current row
   * @param desc the description of this column
   */
  accessor?(row: IDataRow, desc: Readonly<IValueColumnDesc<T>>): T;
}

export interface IFlatColumn {
  readonly col: Column;
  readonly offset: number;
  readonly width: number;
}

export interface IColumnParent {
  remove(col: Column): boolean;

  insert(col: Column, index?: number): Column | null;

  insertAfter(col: Column, reference: Column): Column | null;

  move(col: Column, index?: number): Column | null;

  moveAfter(col: Column, reference: Column): Column | null;

  findMyRanker(): Ranking | null;

  readonly fqid: string;

  indexOf(col: Column): number;

  at(index: number): Column;

  readonly fqpath: string;

}


export interface IColumnMetaData {
  label: string;
  description: string;
}

export declare type ICompareValue = string | number | null;


/**
 * a data row for rendering
 */
export interface IDataRow {
  /**
   * the value
   */
  readonly v: any;
  /**
   * the underlying data index
   */
  readonly i: number;
}


export interface IGroup {
  name: string;
  color: string;
  parent?: Readonly<IGroupParent> | null;
}

export declare type IndicesArray = (ReadonlyArray<number> | UIntTypedArray) & ArrayLike<number>;

export interface IOrderedGroup extends IGroup {
  order: IndicesArray;
}

export const defaultGroup: IGroup = {
  name: 'Default',
  color: 'gray'
};


export interface IGroupParent extends IGroup {
  subGroups: (Readonly<IGroupParent> | Readonly<IGroup>)[];
}

export declare type IGroupMeta = 'first' | 'last' | 'first last' | 'inner' | 'first top' | null;

export interface IGroupItem {
  readonly dataIndex: number;
  readonly group: Readonly<IOrderedGroup>;
  readonly relativeIndex: number;
  readonly meta: IGroupMeta;
}

export interface IGroupData extends Readonly<IOrderedGroup> {
  readonly meta: IGroupMeta;
}

export function isGroup(item: IGroupData | IGroupItem): item is IGroupData {
  return item && (<IGroupItem>item).group == null; // use .group as separator
}


export declare type UIntTypedArray = Uint8Array | Uint16Array | Uint32Array;

export enum ECompareValueType {
  BINARY,
  COUNT, // count max to the number of rows
  UINT8,
  UINT16,
  UINT32,
  INT8,
  INT16,
  INT32,
  FLOAT,
  FLOAT_ASC,
  DOUBLE,
  DOUBLE_ASC,
  STRING
}


export interface IColumnDump {
  id: string;
  width?: number;
  desc: any;
  label?: string;
  renderer?: string;
  /**
   * @deprecated
   */
  rendererType?: string;
  groupRenderer?: string;
  summaryRenderer?: string;

  // type specific
  [key: string]: any;
}

export interface IRankingDump {
  /**
   * columsn of this ranking
   */
  columns?: IColumnDump[];

  /**
   * sort criteria
   */
  sortCriteria?: {asc: boolean, sortBy: string}[];

  /**
   * group sort criteria
   */
  groupSortCriteria?: {asc: boolean, sortBy: string}[];

  /**
   * uids of group columns
   */
  groupColumns?: string[];

  /**
   * compatability
   * @deprecated
   */
  sortColumn?: {sortBy: string, asc: boolean};
}

export interface IMultiLevelColumn extends CompositeColumn {
  getCollapsed(): boolean;

  setCollapsed(value: boolean): void;
}

export function isMultiLevelColumn(col: Column): col is IMultiLevelColumn {
  return typeof ((<IMultiLevelColumn>col).getCollapsed) === 'function';
}


export interface ISortCriteria {
  readonly col: Column;
  readonly asc: boolean;
}
