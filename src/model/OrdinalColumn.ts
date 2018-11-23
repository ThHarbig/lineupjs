import {extent} from 'd3-array';
import {equalArrays} from '../internal';
import {Category, toolbar} from './annotations';
import CategoricalColumn from './CategoricalColumn';
import Column, {widthChanged, labelChanged, metaDataChanged, dirty, dirtyHeader, dirtyValues, rendererTypeChanged, groupRendererChanged, summaryRendererChanged, visibilityChanged} from './Column';
import {
  ICategoricalColumn, ICategoricalDesc, ICategoricalFilter, ICategory, toCategories
} from './ICategoricalColumn';
import {IDataRow} from './interfaces';
import NumberColumn, {INumberColumn} from './NumberColumn';
import ValueColumn, {IValueColumnDesc, dataLoaded} from './ValueColumn';
import {IEventListener} from '../internal/AEventDispatcher';
import {ICategoricalColorMappingFunction, DEFAULT_COLOR_FUNCTION} from './CategoricalColorMappingFunction';

export declare type ICategoricalNumberColumnDesc = ICategoricalDesc & IValueColumnDesc<number>;

/**
 * emitted when the mapping property changes
 * @asMemberOf OrdinalColumn
 * @event
 */
export declare function mappingChanged(previous: number[], current: number[]): void;

/**
 * emitted when the color mapping property changes
 * @asMemberOf OrdinalColumn
 * @event
 */
export declare function colorMappingChanged(previous: ICategoricalColorMappingFunction, current: ICategoricalColorMappingFunction): void;

/**
 * emitted when the filter property changes
 * @asMemberOf OrdinalColumn
 * @event
 */
export declare function filterChanged(previous: ICategoricalFilter | null, current: ICategoricalFilter | null): void;

/**
 * similar to a categorical column but the categories are mapped to numbers
 */
@toolbar('group', 'filterOrdinal', 'colorMappedCategorical')
@Category('categorical')
export default class OrdinalColumn extends ValueColumn<number> implements INumberColumn, ICategoricalColumn {
  static readonly EVENT_MAPPING_CHANGED = NumberColumn.EVENT_MAPPING_CHANGED;
  static readonly EVENT_FILTER_CHANGED = CategoricalColumn.EVENT_FILTER_CHANGED;
  static readonly EVENT_COLOR_MAPPING_CHANGED = CategoricalColumn.EVENT_COLOR_MAPPING_CHANGED;

  readonly categories: ICategory[];

  private colorMapping: ICategoricalColorMappingFunction;

  private readonly lookup = new Map<string, Readonly<ICategory>>();

  private currentFilter: ICategoricalFilter | null = null;


  constructor(id: string, desc: Readonly<ICategoricalNumberColumnDesc>) {
    super(id, desc);
    this.categories = toCategories(desc);
    this.categories.forEach((d) => this.lookup.set(d.name, d));
    this.setDefaultRenderer('number');
    this.setDefaultGroupRenderer('boxplot');
    this.colorMapping = DEFAULT_COLOR_FUNCTION;
  }

  protected createEventList() {
    return super.createEventList().concat([OrdinalColumn.EVENT_COLOR_MAPPING_CHANGED, OrdinalColumn.EVENT_MAPPING_CHANGED, OrdinalColumn.EVENT_FILTER_CHANGED]);
  }

  on(type: typeof OrdinalColumn.EVENT_MAPPING_CHANGED, listener: typeof mappingChanged | null): this;
  on(type: typeof OrdinalColumn.EVENT_COLOR_MAPPING_CHANGED, listener: typeof colorMappingChanged | null): this;
  on(type: typeof OrdinalColumn.EVENT_FILTER_CHANGED, listener: typeof filterChanged | null): this;
  on(type: typeof ValueColumn.EVENT_DATA_LOADED, listener: typeof dataLoaded | null): this;
  on(type: typeof Column.EVENT_WIDTH_CHANGED, listener: typeof widthChanged | null): this;
  on(type: typeof Column.EVENT_LABEL_CHANGED, listener: typeof labelChanged | null): this;
  on(type: typeof Column.EVENT_METADATA_CHANGED, listener: typeof metaDataChanged | null): this;
  on(type: typeof Column.EVENT_DIRTY, listener: typeof dirty | null): this;
  on(type: typeof Column.EVENT_DIRTY_HEADER, listener: typeof dirtyHeader | null): this;
  on(type: typeof Column.EVENT_DIRTY_VALUES, listener: typeof dirtyValues | null): this;
  on(type: typeof Column.EVENT_RENDERER_TYPE_CHANGED, listener: typeof rendererTypeChanged | null): this;
  on(type: typeof Column.EVENT_GROUP_RENDERER_TYPE_CHANGED, listener: typeof groupRendererChanged | null): this;
  on(type: typeof Column.EVENT_SUMMARY_RENDERER_TYPE_CHANGED, listener: typeof summaryRendererChanged | null): this;
  on(type: typeof Column.EVENT_VISIBILITY_CHANGED, listener: typeof visibilityChanged | null): this;
  on(type: string | string[], listener: IEventListener | null): this {
    return super.on(<any>type, listener);
  }

  get dataLength() {
    return this.categories.length;
  }

  get labels() {
    return this.categories.map((d) => d.label);
  }

  getValue(row: IDataRow) {
    const v = this.getNumber(row);
    return isNaN(v) ? null : v;
  }

  getCategory(row: IDataRow) {
    const v = super.getValue(row);
    if (!v) {
      return null;
    }
    const vs = String(v);
    return this.lookup.has(vs) ? this.lookup.get(vs)! : null;
  }

  getColor(row: IDataRow) {
    return CategoricalColumn.prototype.getColor.call(this, row);
  }

  getLabel(row: IDataRow) {
    return CategoricalColumn.prototype.getLabel.call(this, row);
  }

  getLabels(row: IDataRow) {
    return CategoricalColumn.prototype.getLabels.call(this, row);
  }

  getValues(row: IDataRow) {
    return CategoricalColumn.prototype.getValues.call(this, row);
  }

  getMap(row: IDataRow) {
    return CategoricalColumn.prototype.getMap.call(this, row);
  }

  getMapLabel(row: IDataRow) {
    return CategoricalColumn.prototype.getMapLabel.call(this, row);
  }

  getSet(row: IDataRow) {
    return CategoricalColumn.prototype.getSet.call(this, row);
  }

  getNumber(row: IDataRow) {
    const v = this.getCategory(row);
    return v ? v.value : NaN;
  }

  getRawNumber(row: IDataRow) {
    return this.getNumber(row);
  }

  getExportValue(row: IDataRow, format: 'text' | 'json'): any {
    if (format === 'json') {
      const value = this.getNumber(row);
      if (isNaN(value)) {
        return null;
      }
      return {
        name: this.getLabel(row),
        value
      };
    }
    return super.getExportValue(row, format);
  }

  dump(toDescRef: (desc: any) => any): any {
    const r = CategoricalColumn.prototype.dump.call(this, toDescRef);
    r.mapping = this.getMapping();
    return r;
  }

  restore(dump: any, factory: (dump: any) => Column | null) {
    CategoricalColumn.prototype.restore.call(this, dump, factory);
    if (dump.mapping) {
      this.setMapping(dump.mapping);
    }
  }

  getMapping() {
    return this.categories.map((d) => d.value);
  }

  setMapping(mapping: number[]) {
    const r = extent(mapping);
    mapping = mapping.map((d) => (d - r[0]!) / (r[1]! - r[0]!));
    const bak = this.getMapping();
    if (equalArrays(bak, mapping)) {
      return;
    }
    this.categories.forEach((d, i) => d.value = mapping[i] || 0);
    this.fire([OrdinalColumn.EVENT_MAPPING_CHANGED, Column.EVENT_DIRTY_HEADER, Column.EVENT_DIRTY_VALUES, Column.EVENT_DIRTY], bak, this.getMapping());
  }

  getColorMapping() {
    return this.colorMapping.clone();
  }

  setColorMapping(mapping: ICategoricalColorMappingFunction) {
    return CategoricalColumn.prototype.setColorMapping.call(this, mapping);
  }

  isFiltered() {
    return this.currentFilter != null;
  }

  filter(row: IDataRow): boolean {
    return CategoricalColumn.prototype.filter.call(this, row);
  }

  group(row: IDataRow) {
    return CategoricalColumn.prototype.group.call(this, row);
  }

  getFilter() {
    return this.currentFilter;
  }

  setFilter(filter: ICategoricalFilter | null) {
    return CategoricalColumn.prototype.setFilter.call(this, filter);
  }

  toCompareValue(row: IDataRow) {
    return CategoricalColumn.prototype.toCompareValue.call(this, row);
  }

  toCompareValueType() {
    return CategoricalColumn.prototype.toCompareValueType.call(this);
  }

  getRenderer(): string {
    return NumberColumn.prototype.getRenderer.call(this);
  }
}
