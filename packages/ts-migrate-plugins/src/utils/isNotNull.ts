import { Nullable } from '../../types';

export default function isNotNull<T>(item: Nullable<T>): item is NonNullable<T> {
  return item != null;
}
