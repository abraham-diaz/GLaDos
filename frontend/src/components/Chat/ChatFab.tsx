interface Props {
  isOpen: boolean;
  onClick: () => void;
}

export default function ChatFab({ isOpen, onClick }: Props) {
  if (isOpen) return null;

  return (
    <button className="chat-fab" onClick={onClick}>
      <img src="/icon-192.svg" alt="GLaDOS" className="chat-fab-icon" />
    </button>
  );
}
