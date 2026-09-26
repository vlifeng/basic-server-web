import type { UiNode } from '../shared';

export function UiPreview({ node }: { node: UiNode | null }) {
  if (!node) {
    return (
      <div className="preview-empty">
        选中带解释器芯片的节点，右侧会渲染声明式界面。
      </div>
    );
  }
  return <UiNodeView node={node} />;
}

function UiNodeView({ node }: { node: UiNode }) {
  const props = node.props ?? {};
  const children = node.children ?? [];

  switch (node.type) {
    case 'stack':
      return (
        <div className="ui-stack">
          {children.map((c, i) => (
            <UiNodeView key={i} node={c} />
          ))}
        </div>
      );
    case 'card':
      return (
        <div className="ui-card">
          {typeof props.title === 'string' && (
            <div className="ui-card-title">{props.title}</div>
          )}
          {children.map((c, i) => (
            <UiNodeView key={i} node={c} />
          ))}
        </div>
      );
    case 'text':
      return (
        <p className={`ui-text ${props.variant === 'muted' ? 'muted' : ''}`}>
          {String(props.label ?? props.title ?? '')}
        </p>
      );
    case 'list':
      return (
        <ul className="ui-list">
          {children.map((c, i) => (
            <UiNodeView key={i} node={c} />
          ))}
        </ul>
      );
    case 'listItem':
      return <li className="ui-list-item">{String(props.label ?? '')}</li>;
    case 'nav':
      return (
        <nav className="ui-nav">
          {children.map((c, i) => (
            <UiNodeView key={i} node={c} />
          ))}
        </nav>
      );
    case 'navItem':
      return (
        <span className="ui-nav-item">{String(props.label ?? '')}</span>
      );
    default:
      return <div className="ui-unknown">未知 type（已忽略）</div>;
  }
}
