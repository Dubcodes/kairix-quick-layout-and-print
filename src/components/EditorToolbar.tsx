import { Icon } from './Icon';

interface Props {
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onPick: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRotateSelected: () => void;
  calibrationMode: boolean;
  onToggleCalibration: () => void;
}

export function EditorToolbar(props: Props) {
  return (
    <nav className="editor-toolbar" aria-label="Editor tools">
      <button className="tool-button tool-button--primary" type="button" onClick={props.onPick} disabled={props.calibrationMode}>
        <Icon name="upload" />
        <span>Add photos</span>
      </button>
      <span className="toolbar-divider" />
      <button className="tool-button" type="button" onClick={props.onUndo} disabled={!props.canUndo} title="Undo">
        <Icon name="undo" />
        <span>Undo</span>
      </button>
      <button className="tool-button" type="button" onClick={props.onRedo} disabled={!props.canRedo} title="Redo">
        <Icon name="redo" />
        <span>Redo</span>
      </button>
      <span className="toolbar-divider" />
      <button className="tool-button" type="button" onClick={props.onDuplicate} disabled={!props.hasSelection}>
        <Icon name="duplicate" />
        <span>Duplicate</span>
      </button>
      <button className="tool-button" type="button" onClick={props.onRotateSelected} disabled={!props.hasSelection}>
        <Icon name="rotate" />
        <span>Rotate 90°</span>
      </button>
      <button className="tool-button tool-button--danger" type="button" onClick={props.onDelete} disabled={!props.hasSelection}>
        <Icon name="delete" />
        <span>Delete</span>
      </button>
      <span className="toolbar-spacer" />
      <button className="utility-button" type="button" onClick={props.onToggleCalibration} aria-pressed={props.calibrationMode}>
        {props.calibrationMode ? 'Back to photo layout' : 'Print calibration'}
      </button>
    </nav>
  );
}
