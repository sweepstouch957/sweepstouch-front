import { projects_board } from 'src/mocks/projects_board';
import type { List, Member, Project, Task } from 'src/models/projects_board';
import objectArray from 'src/utils/objectArray';
import { create } from 'zustand';

/** AppThunk equivalente: recibe set/get (en lugar de dispatch) */
export type AppThunk = (
  set: (
    partial:
      | Partial<ProjectsBoardState>
      | ((state: ProjectsBoardState) => Partial<ProjectsBoardState>)
  ) => void,
  get: () => ProjectsBoardState
) => Promise<void>;

export interface ProjectsBoardState {
  isLoaded: boolean;

  /** ✅ guardamos el project raw completo */
  projectRaw: Project | null;

  lists: {
    byId: Record<string, List>;
    allIds: string[];
  };

  tasks: {
    byId: Record<string, Task>;
    allIds: string[];
  };

  members: {
    byId: Record<string, Member>;
    allIds: string[];
  };

  /* ===== reducers internos ===== */
  _setProject: (project: Project) => void;
  _setList: (list: List) => void;
  _moveTaskLocal: (payload: { taskId: string; position: number; listId?: string }) => void;

  /* ===== thunks públicos ===== */
  getProject: () => AppThunk;
  updateList: (listId: string, update: any) => AppThunk;
  moveTask: (taskId: string, position: number, listId?: string) => AppThunk;
}

export const useProjectsBoardStore = create<ProjectsBoardState>((set, get) => ({
  isLoaded: false,
  projectRaw: null,

  lists: { byId: {}, allIds: [] },
  tasks: { byId: {}, allIds: [] },
  members: { byId: {}, allIds: [] },

  /* ===================== reducers internos ===================== */
  _setProject: (project) =>
    set(() => {
      const listsById = objectArray(project.lists) as Record<string, List>;
      const tasksById = objectArray(project.tasks) as Record<string, Task>;
      const membersById = objectArray(project.members) as Record<string, Member>;

      return {
        projectRaw: project,
        lists: { byId: listsById, allIds: Object.keys(listsById) },
        tasks: { byId: tasksById, allIds: Object.keys(tasksById) },
        members: { byId: membersById, allIds: Object.keys(membersById) },
        isLoaded: true,
      };
    }),

  _setList: (list) =>
    set((state) => ({
      lists: {
        ...state.lists,
        byId: {
          ...state.lists.byId,
          [list.id]: list,
        },
      },
    })),

  _moveTaskLocal: ({ taskId, position, listId }) =>
    set((state) => {
      const task = state.tasks.byId[taskId];
      if (!task) return state;

      const sourceListId = task.listId;

      const listsById = { ...state.lists.byId };
      const tasksById = { ...state.tasks.byId };

      const sourceList = listsById[sourceListId];
      if (!sourceList) return state;

      // 1) quitar del source
      const sourceTaskIds = (sourceList.taskIds ?? []).filter((id) => id !== taskId);
      listsById[sourceListId] = { ...sourceList, taskIds: sourceTaskIds };

      // 2) insertar en target o reinsertar en mismo
      if (listId) {
        const targetList = listsById[listId];
        if (!targetList) return state;

        tasksById[taskId] = { ...task, listId };

        const targetTaskIds = [...(targetList.taskIds ?? [])];
        targetTaskIds.splice(position, 0, taskId);
        listsById[listId] = { ...targetList, taskIds: targetTaskIds };
      } else {
        const sameTaskIds = [...(listsById[sourceListId].taskIds ?? [])];
        sameTaskIds.splice(position, 0, taskId);
        listsById[sourceListId] = { ...listsById[sourceListId], taskIds: sameTaskIds };
      }

      return {
        lists: { ...state.lists, byId: listsById },
        tasks: { ...state.tasks, byId: tasksById },
      };
    }),

  /* ===================== thunks públicos ===================== */
  getProject: () => async (_set, _get) => {
    const response = await projects_board.getProject();
    _get()._setProject(response);
  },

  updateList: (listId: string, update: any) => async (_set, _get) => {
    const response = await projects_board.updateList({ listId, update });
    _get()._setList(response);
  },

  moveTask: (taskId: string, position: number, listId?: string) => async (_set, _get) => {
    await projects_board.moveTask({ taskId, position, listId });
    _get()._moveTaskLocal({ taskId, position, listId });
  },
}));

/* ===================== runner ===================== */
export const runProjectsBoardThunk = async (thunk: AppThunk) => {
  const set = useProjectsBoardStore.setState as any;
  const get = useProjectsBoardStore.getState;
  return thunk(set, get);
};

/* ===================== exports “tipo redux” (opcionales) ===================== */
export const getProject = () => useProjectsBoardStore.getState().getProject();
export const updateList = (listId: string, update: any) =>
  useProjectsBoardStore.getState().updateList(listId, update);
export const moveTask = (taskId: string, position: number, listId?: string) =>
  useProjectsBoardStore.getState().moveTask(taskId, position, listId);

/* ===================== selectors (recomendado) ===================== */
export const selectBoardLoaded = (s: ProjectsBoardState) => s.isLoaded;
export const selectProjectRaw = (s: ProjectsBoardState) => s.projectRaw;
export const selectListById = (listId: string) => (s: ProjectsBoardState) => s.lists.byId[listId];
export const selectTaskById = (taskId: string) => (s: ProjectsBoardState) => s.tasks.byId[taskId];
export const selectMemberById = (memberId: string) => (s: ProjectsBoardState) =>
  s.members.byId[memberId];

export default useProjectsBoardStore;
