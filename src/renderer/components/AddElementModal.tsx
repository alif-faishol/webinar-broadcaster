import { ModalProps, Modal } from 'antd';
import BroadcasterService from '../../services/broadcaster';

type AddElementModalProps = {
  visible: boolean;
};

const broadcaster = BroadcasterService.getIpcRendererClient();

const AddElementModal: FC<AddElementModalProps> = ({ visible }) => {
  return <Modal visible={visible} />;
};
