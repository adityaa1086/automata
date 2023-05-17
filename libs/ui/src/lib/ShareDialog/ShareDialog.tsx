import { DialogComponent } from '../DialogComponent/DialogComponent';
import {FormFieldComponent} from '../FormFieldComponent/FormFieldComponent';
import * as  Form  from '@radix-ui/react-form';
import { ButtonComponent } from '../ButtonComponent/ButtonComponent';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { store } from '@tool-ai/state';
import {BsClipboard} from 'react-icons/bs';
/* eslint-disable-next-line */
export interface ShareDialogProps {
  title:string,
  value: string
}


function ShareDialog(props: ShareDialogProps) {

  return (
    <DialogComponent
    trigger={
      <div className='flex justify-between text-xs pl-[25px] H-[25px] pr-[5px]'
      >
       {props.title}<div className={'ml-auto pl-5 text-gray-500 [data-highlighted]:text-primary [data-disabled]:text-gray-light'}>⌘+N</div>

      </div>
    }
    title="Share"
    closeButton={
    <ButtonComponent
      type='button'
      ariaLabel='share modal close button'
      buttonContent='Close'
       />}
    >
    <div className="flex">
    <input aria-label="sharing link" type="text"
    className='block w-full border-2 border-solid border-gray-100 rounded-md' value={props.value} readOnly></input>
    <button aria-label="copy link" onClick={() => navigator.clipboard.writeText(props.value)}><BsClipboard /></button>
    </div>
    </DialogComponent>

  );
}

export {ShareDialog};
