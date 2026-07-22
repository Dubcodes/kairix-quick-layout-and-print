import { Icon } from './Icon';
import { Tooltip } from './Tooltip';

interface Props {
  hasSelection: boolean;
  hasPhotos: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onPick: () => void;
  onAutoArrange: () => void;
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
      <Tooltip className="toolbar-primary-action" content={props.calibrationMode ? 'Return to the photo layout before adding photos.' : 'Choose JPEG, PNG or WebP photos from this device.'} disabled={props.calibrationMode}>
        <button className="tool-button tool-button--primary" type="button" onClick={props.onPick} disabled={props.calibrationMode}>
          <Icon name="upload" />
          <span>Add photos</span>
        </button>
      </Tooltip>
      <Tooltip className="toolbar-primary-action" content={!props.hasPhotos ? 'Add at least one photo before using Auto Arrange.' : props.calibrationMode ? 'Return to the photo layout before arranging photos.' : 'Generate a fresh balanced layout inside the safe margin.'} disabled={!props.hasPhotos || props.calibrationMode}>
        <button className="tool-button tool-button--primary tool-button--arrange" type="button" onClick={props.onAutoArrange} disabled={!props.hasPhotos || props.calibrationMode}>
          <Icon name="arrange" />
          <span>Auto Arrange</span>
        </button>
      </Tooltip>
      <span className="toolbar-divider" />
      <Tooltip content={props.canUndo ? 'Undo the last layout or editing action.' : 'There is no action to undo yet.'} disabled={!props.canUndo}>
        <button className="tool-button" type="button" onClick={props.onUndo} disabled={!props.canUndo}><Icon name="undo" /><span>Undo</span></button>
      </Tooltip>
      <Tooltip content={props.canRedo ? 'Redo the last undone action.' : 'There is no action to redo yet.'} disabled={!props.canRedo}>
        <button className="tool-button" type="button" onClick={props.onRedo} disabled={!props.canRedo}><Icon name="redo" /><span>Redo</span></button>
      </Tooltip>
      <span className="toolbar-divider" />
      <Tooltip content={props.hasSelection ? 'Create another copy and place it in available space.' : 'Select a photo before duplicating it.'} disabled={!props.hasSelection}>
        <button className="tool-button" type="button" onClick={props.onDuplicate} disabled={!props.hasSelection}><Icon name="duplicate" /><span>Duplicate</span></button>
      </Tooltip>
      <Tooltip content={props.hasSelection ? 'Rotate the selected photo clockwise by 90 degrees.' : 'Select a photo before rotating it.'} disabled={!props.hasSelection}>
        <button className="tool-button" type="button" onClick={props.onRotateSelected} disabled={!props.hasSelection}><Icon name="rotate" /><span>Rotate 90°</span></button>
      </Tooltip>
      <Tooltip content={props.hasSelection ? 'Remove the selected photo from the page.' : 'Select a photo before deleting it.'} disabled={!props.hasSelection}>
        <button className="tool-button tool-button--danger" type="button" onClick={props.onDelete} disabled={!props.hasSelection}><Icon name="delete" /><span>Delete</span></button>
      </Tooltip>
      <span className="toolbar-spacer" />
      <Tooltip className="toolbar-utility-action" content={props.calibrationMode ? 'Return to your photo layout.' : 'Open the exact-size A4 printer calibration sheet.'}>
        <button className="utility-button" type="button" onClick={props.onToggleCalibration} aria-pressed={props.calibrationMode}>{props.calibrationMode ? 'Back to photo layout' : 'Print calibration'}</button>
      </Tooltip>
      <Tooltip className="toolbar-utility-action" content="Open the complete local help guide.">
        <a className="utility-button utility-link" href="#/help"><Icon name="help" />Help</a>
      </Tooltip>
    </nav>
  );
}
