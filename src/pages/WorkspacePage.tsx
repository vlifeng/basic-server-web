import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UiPreview } from '../components/UiPreview';
import type { Workspace, WorkspaceMember, WorkspaceNode } from '../shared';
import { api, clearToken, getToken } from '../lib/api';

function flattenNodes(items: WorkspaceNode[]): WorkspaceNode[] {
  const out: WorkspaceNode[] = [];
  const walk = (nodes: WorkspaceNode[]) => {
    for (const n of nodes) {
      out.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(items);
  return out;
}

function valueAsText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function WorkspacePage() {
  const nav = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [nodes, setNodes] = useState<WorkspaceNode[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNodeKey, setNewNodeKey] = useState('');
  const [error, setError] = useState('');
  const [yjsStatus] = useState<'offline' | 'connecting' | 'synced'>('offline');
  const [loading, setLoading] = useState(true);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);

  const flatNodes = useMemo(() => flattenNodes(nodes), [nodes]);

  const load = useCallback(async () => {
    if (!getToken()) {
      nav('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.listWorkspaces();
      setWorkspaces(res.items);
      if (res.items.length && !activeId) {
        setActiveId(res.items[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      if (String(err).toLowerCase().includes('unauthorized')) {
        clearToken();
        nav('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [nav, activeId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!activeId) {
      setMembers([]);
      return;
    }
    api
      .listMembers(activeId)
      .then((res) => setMembers(res.items))
      .catch(() => setMembers([]));
  }, [activeId]);

  const loadNodes = useCallback(async (workspaceId: string) => {
    setNodesLoading(true);
    setError('');
    try {
      const res = await api.listNodes(workspaceId, { view: 'tree' });
      setNodes(res.items);
      const flat = flattenNodes(res.items);
      setSelectedId((prev) =>
        prev && flat.some((n) => n.id === prev) ? prev : flat[0]?.id ?? '',
      );
    } catch (err) {
      setNodes([]);
      setSelectedId('');
      setError(err instanceof Error ? err.message : '加载节点失败');
    } finally {
      setNodesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeId) {
      setNodes([]);
      setSelectedId('');
      return;
    }
    void loadNodes(activeId);
  }, [activeId, loadNodes]);

  const selected = useMemo(
    () => flatNodes.find((n) => n.id === selectedId) ?? null,
    [flatNodes, selectedId],
  );

  // 默认树：右预览只读同步选中节点文字；自定义解释器（看板）下一刀
  const preview =
    selected && !selected.interpreterId
      ? {
          type: 'stack' as const,
          children: [
            {
              type: 'card' as const,
              props: { title: selected.key },
              children: [
                {
                  type: 'text' as const,
                  props: {
                    label: valueAsText(selected.value) || '（空）',
                    variant: 'muted',
                  },
                },
              ],
            },
          ],
        }
      : null;

  async function onCreateWorkspace() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError('');
    try {
      const ws = await api.createWorkspace({ name });
      setWorkspaces((prev) => [ws, ...prev]);
      setActiveId(ws.id);
      setNewName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setCreating(false);
    }
  }

  async function onCreateNode() {
    if (!activeId) return;
    const key = newNodeKey.trim();
    if (!key) return;
    setError('');
    try {
      const created = await api.createNode(activeId, {
        key,
        parentId: selectedId || null,
        value: '',
      });
      setNewNodeKey('');
      await loadNodes(activeId);
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建节点失败');
    }
  }

  async function onDeleteNode() {
    if (!activeId || !selectedId) return;
    setError('');
    try {
      await api.deleteNode(activeId, selectedId, true);
      await loadNodes(activeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  function startEdit(n: WorkspaceNode) {
    setEditingId(n.id);
    setEditKey(n.key);
    setEditValue(valueAsText(n.value));
    setSelectedId(n.id);
  }

  async function saveEdit() {
    if (!activeId || !editingId) return;
    const key = editKey.trim();
    if (!key) return;
    setError('');
    try {
      await api.updateNode(activeId, editingId, {
        key,
        value: editValue,
      });
      setEditingId(null);
      await loadNodes(activeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  }

  async function onDropOnto(targetId: string | null) {
    if (!activeId || !dragId) return;
    if (dragId === targetId) {
      setDragId(null);
      return;
    }
    setError('');
    try {
      await api.moveNode(activeId, dragId, { parentId: targetId });
      setDragId(null);
      await loadNodes(activeId);
    } catch (err) {
      setDragId(null);
      setError(err instanceof Error ? err.message : '移动失败');
    }
  }

  const active = workspaces.find((w) => w.id === activeId);

  function renderTree(items: WorkspaceNode[], depth: number) {
    return items.map((n) => (
      <div
        key={n.id}
        className="tree-row-wrap"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void onDropOnto(n.id);
        }}
      >
        <div
          className={`tree-row ${selectedId === n.id ? 'active' : ''} ${
            dragId === n.id ? 'dragging' : ''
          }`}
          style={{ paddingLeft: 12 + depth * 14 }}
          draggable
          onDragStart={(e) => {
            setDragId(n.id);
            e.dataTransfer.setData('text/plain', n.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={() => setDragId(null)}
          onClick={() => setSelectedId(n.id)}
          onDoubleClick={() => startEdit(n)}
        >
          {editingId === n.id ? (
            <div className="tree-edit" onClick={(e) => e.stopPropagation()}>
              <input
                className="tree-edit-key"
                value={editKey}
                onChange={(e) => setEditKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveEdit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
              />
              <input
                className="tree-edit-value"
                placeholder="文字"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void saveEdit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
              />
              <button type="button" className="tiny" onClick={() => void saveEdit()}>
                存
              </button>
            </div>
          ) : (
            <>
              <span className="tree-key">{n.key}</span>
              {valueAsText(n.value) ? (
                <span className="tree-val muted">{valueAsText(n.value)}</span>
              ) : null}
              {n.interpreterId ? (
                <span className="interp-chip" title={n.interpreterId}>
                  {n.interpreterId.length > 12
                    ? `${n.interpreterId.slice(0, 8)}…`
                    : n.interpreterId}
                </span>
              ) : null}
            </>
          )}
        </div>
        {n.children?.length ? renderTree(n.children, depth + 1) : null}
      </div>
    ));
  }

  if (loading) {
    return (
      <div className="ws-loading">
        <div className="card">加载 Workspace…</div>
      </div>
    );
  }

  return (
    <div className="ws-app">
      <header className="ws-top">
        <div className="ws-brand">天宫</div>
        <div className="ws-workspace">
          <select
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            aria-label="Workspace"
          >
            {workspaces.length === 0 && (
              <option value="">暂无 Workspace</option>
            )}
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <div className="ws-create">
            <input
              placeholder="新建名称"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              type="button"
              className="tiny"
              disabled={creating}
              onClick={() => void onCreateWorkspace()}
            >
              新建
            </button>
          </div>
        </div>
        <div className={`yjs-pill ${yjsStatus}`} title="Yjs 通道下一刀接入">
          Yjs · {yjsStatus}
        </div>
        <button
          type="button"
          className="tiny ghost"
          onClick={() => setShowMembers((v) => !v)}
        >
          成员 {members.length ? `(${members.length})` : ''}
        </button>
        <Link className="tiny-link" to="/me">
          我的
        </Link>
      </header>

      {error && <div className="ws-banner error">{error}</div>}

      <div className="ws-body">
        <aside className="ws-left">
          <div className="pane-title">
            节点树
            <span className="muted">
              {active ? active.name : '先创建 Workspace'}
            </span>
          </div>
          <div
            className="tree"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void onDropOnto(null);
            }}
          >
            {nodesLoading ? (
              <p className="muted" style={{ padding: 12 }}>
                加载节点…
              </p>
            ) : (
              renderTree(nodes, 0)
            )}
          </div>
          {activeId ? (
            <div className="ws-create" style={{ padding: '8px 12px' }}>
              <input
                placeholder={selectedId ? '子节点 key' : '根节点 key'}
                value={newNodeKey}
                onChange={(e) => setNewNodeKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onCreateNode();
                }}
              />
              <button
                type="button"
                className="tiny"
                onClick={() => void onCreateNode()}
              >
                添加
              </button>
              {selectedId ? (
                <>
                  <button
                    type="button"
                    className="tiny ghost"
                    onClick={() => {
                      const n = flatNodes.find((x) => x.id === selectedId);
                      if (n) startEdit(n);
                    }}
                  >
                    改
                  </button>
                  <button
                    type="button"
                    className="tiny ghost"
                    onClick={() => void onDeleteNode()}
                  >
                    删
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
          <p className="pane-hint">
            默认树：双击改字，拖到节点上变子，拖到空白变根。看板解释器下一刀。
          </p>
        </aside>

        <main className="ws-right">
          <div className="pane-title">
            预览
            <span className="muted">
              {selected?.interpreterId
                ? `解释器 · ${selected.interpreterId}`
                : selected
                  ? '默认树 · 只读同步'
                  : '选中节点'}
            </span>
          </div>
          <div className="preview-frame">
            <UiPreview node={preview} />
          </div>
        </main>

        {showMembers && (
          <aside className="ws-members">
            <div className="pane-title">成员</div>
            <ul>
              {members.map((m) => (
                <li key={m.userId}>
                  <strong>{m.displayName || m.userId.slice(0, 8)}</strong>
                  <span className="muted"> · {m.role}</span>
                </li>
              ))}
              {!members.length && (
                <li className="muted">选择或创建 Workspace 后显示</li>
              )}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
