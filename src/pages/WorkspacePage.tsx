import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UiPreview } from '../components/UiPreview';
import type { UiNode, Workspace, WorkspaceMember } from '../shared';
import { api, clearToken, getToken } from '../lib/api';

type TreeNode = {
  id: string;
  key: string;
  parentId: string | null;
  interpreterId?: string | null;
  preview?: UiNode | null;
};

const DEMO_NODES: TreeNode[] = [
  {
    id: 'n-root',
    key: 'home',
    parentId: null,
    interpreterId: 'demo-ui',
    preview: {
      type: 'stack',
      children: [
        {
          type: 'card',
          props: { title: '欢迎' },
          children: [
            {
              type: 'text',
              props: { label: '节点树活成界面。换解释器，同一棵树换一张脸。' },
            },
          ],
        },
        {
          type: 'nav',
          children: [
            { type: 'navItem', props: { label: '概览' } },
            { type: 'navItem', props: { label: '笔记' } },
          ],
        },
        {
          type: 'list',
          children: [
            { type: 'listItem', props: { label: '父子 KV 节点' } },
            { type: 'listItem', props: { label: '解释器插件（吐界面）' } },
            { type: 'listItem', props: { label: 'Yjs 同步（下一刀）' } },
          ],
        },
      ],
    },
  },
  {
    id: 'n-a',
    key: 'inbox',
    parentId: 'n-root',
  },
  {
    id: 'n-b',
    key: 'drafts',
    parentId: 'n-root',
    interpreterId: 'demo-ui',
    preview: {
      type: 'card',
      props: { title: '草稿箱' },
      children: [
        {
          type: 'text',
          props: { label: '这是另一颗挂了解释器的节点。', variant: 'muted' },
        },
      ],
    },
  },
];

export function WorkspacePage() {
  const nav = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('n-root');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [yjsStatus] = useState<'offline' | 'connecting' | 'synced'>('offline');
  const [loading, setLoading] = useState(true);

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

  const selected = useMemo(
    () => DEMO_NODES.find((n) => n.id === selectedId) ?? null,
    [selectedId],
  );

  const preview = selected?.interpreterId ? selected.preview ?? null : null;

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

  const active = workspaces.find((w) => w.id === activeId);

  function renderTree(parentId: string | null, depth: number) {
    return DEMO_NODES.filter((n) => n.parentId === parentId).map((n) => (
      <div key={n.id} className="tree-row-wrap">
        <button
          type="button"
          className={`tree-row ${selectedId === n.id ? 'active' : ''}`}
          style={{ paddingLeft: 12 + depth * 14 }}
          onClick={() => setSelectedId(n.id)}
        >
          <span className="tree-key">{n.key}</span>
          {n.interpreterId ? (
            <span className="interp-chip" title="解释器">
              UI
            </span>
          ) : null}
        </button>
        {renderTree(n.id, depth + 1)}
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
        <div
          className={`yjs-pill ${yjsStatus}`}
          title="Yjs 通道下一刀接入"
        >
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
          <div className="tree">{renderTree(null, 0)}</div>
          <p className="pane-hint">
            树数据暂为本地演示；节点 REST / Yjs 下一刀接入真实数据。
          </p>
        </aside>

        <main className="ws-right">
          <div className="pane-title">
            预览
            <span className="muted">
              {selected?.interpreterId
                ? `解释器 · ${selected.key}`
                : '未挂解释器'}
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
