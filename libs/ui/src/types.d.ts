export interface Validation {
  match:
    | 'badInput'
    | 'patternMismatch'
    | 'rangeOverflow'
    | 'rangeUnderflow'
    | 'stepMismatch'
    | 'tooLong'
    | 'tooShort'
    | 'typeMismatch'
    | 'valid'
    | 'valueMissing'
    | Form.CustomMatcher
    | undefined;
  message: string;
}

export interface FormFieldProps {
  label: string;
  validations?: Validation[];
  type: string;
  required?: boolean;
  value?: any;
  onChange: any;
  placeholder?: string;
}

export interface NodeWrapperComponentProps {
  isConnectable: boolean;
  data: any;
  isDialogOpen: boolean;
  setIsDialogOpen: (arg: boolean) => void;
}

interface TooltipProps {
  buttonContent?: JSX.Element | string;
  text: string;
  name?: string;
  clickHandler?: () => void;
}

interface NodeDialogProps {
  isOpen: boolean;
  onClose: (boolean: boolean) => void;
  activeDialog: string;
  nodes: Node<{ label: string }, string | undefined>[];
  setNodes: any;
  activeNodeId: string;
}
interface FlowCollaborator {
  id: string;
  name: string;
  initials: string;
}

interface Flow {
  id: string;
  title: string;
  ownerId: string;
  stringifiedNodes: string;
  stringifiedEdges: string;
  collaboratorIds: string[];
  collaborators: FlowCollaborator[];
}

interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  flows: string[];
  profileImg?: string;
}

interface FlowTabsDropdownProps {
  flowChartOwner: string;
  users: FlowCollaborators[];
  onSave: () => void;
}

interface AvatarProps {
  initials: string;
  name?: string;
  url?: string;
  alt?: string;
}

interface AlertProps {
  buttonText: string;
  title?: string;
  description?: string;
  classes?: string;
}
