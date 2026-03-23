import { IoMdSend } from "react-icons/io";

const CommentsPanel = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 text-center">
        <h3 className="text-sm font-semibold">Comments</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex gap-3">
          <div className="w-8 h-8 flex justify-center items-center rounded bg-red-500 flex-shrink-0">
            :)
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium opacity-80">Etieno Udobot</p>
            <div className="bg-[#1f1f1f] p-3 rounded-xl rounded-tl-none text-xs leading-relaxed">
              Are y'all seeing this???? I can't believe they let Arthur die in Season 2!!!!
            </div>
            <div className="flex gap-2">
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">😲 7</span>
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">😭 25</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="bg-white/20 p-3 rounded-xl rounded-tr-none text-xs max-w-[80%]">
            I think his death was validated, i feel he has outlived his purpose.
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="bg-[#141414] border border-white/20 rounded-full px-4 py-2 flex items-center gap-3">
          <input
            placeholder="Add comment"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:opacity-40"
          />
          <button>
            <IoMdSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentsPanel;