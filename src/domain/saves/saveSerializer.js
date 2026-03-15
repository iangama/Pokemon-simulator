import { formatDateIso } from '../../utils/formatters';

export function serializeSave(state) {
  return {
    ...state,
    updatedAt: formatDateIso(),
    version: 1,
  };
}
