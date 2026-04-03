import { IoMdSend } from 'react-icons/io'
import { MdClose } from 'react-icons/md'

const getInitials = (name = 'Guest') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

const formatTime = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })
}

const CommentsPanel = ({
  messages = [],
  draft = '',
  onDraftChange,
  onSend,
  currentUserId,
  connectionStatus = 'connecting',
  onClose
}) => {
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-black text-white">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Watch Party Chat</h3>
            <p className="mt-1 text-xs text-gray-400">
              {connectionStatus === 'connected' ? 'Chat is live' : 'Connecting chat...'}
            </p>
          </div>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Close comments panel"
            >
              <MdClose size={18} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-gray-500">
            No messages yet. Start the conversation.
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.userId && currentUserId && message.userId === currentUserId

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[85%] gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    }`}
                >
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${isOwnMessage ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-200'
                      }`}
                  >
                    {getInitials(message.userName)}
                  </div>

                  <div className={`space-y-1 ${isOwnMessage ? 'items-end text-right' : 'text-left'}`}>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <span>{isOwnMessage ? 'You' : message.userName || 'Guest'}</span>
                      {message.createdAt ? <span>{formatTime(message.createdAt)}</span> : null}
                    </div>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${isOwnMessage
                          ? 'rounded-tr-md bg-red-600 text-white'
                          : 'rounded-tl-md bg-[#1c1c1c] text-gray-100'
                        }`}
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={onSend} className="border-t border-white/10 px-4 py-4">
        <div className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-[#141414] px-4 py-3">
          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Type a message"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
          />
          <button
            type="submit"
            disabled={!draft.trim() || connectionStatus !== 'connected'}
            className="rounded-full bg-red-600 p-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IoMdSend />
          </button>
        </div>
      </form>
    </div>
  )
}

export default CommentsPanel
