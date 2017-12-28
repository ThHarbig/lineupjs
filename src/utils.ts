/**
 * Created by Samuel Gratzl on 14.08.2015.
 */


export function findOption(options: any) {
  return (key: string, defaultValue: any): any => {
    if (key in options) {
      return options[key];
    }
    if (key.indexOf('.') > 0) {
      const p = key.substring(0, key.indexOf('.'));
      key = key.substring(key.indexOf('.') + 1);
      if (p in options && key in options[p]) {
        return options[p][key];
      }
    }
    return defaultValue;
  };
}


export function equalArrays<T>(a: T[], b: T[]) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((ai, i) => ai === b[i]);
}
