const AttendeesPanel = () => {
  const attendees = [
    { name: 'Etieno Udobot', color: 'bg-red-500' },
    { name: 'Not Majek Fashek', color: 'bg-blue-500' },
    { name: 'Samuel James', color: 'bg-teal-700' },
    { name: 'Floyd Miles', color: 'bg-orange-500' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold">Watch Party Attendees</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {attendees.map((user, i) => (
          <div key={i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition cursor-pointer">
            {user.img ? (
              <img src={user.img} className="w-8 h-8 rounded" alt="" />
            ) : (
              <div className={`w-8 h-8 rounded ${user.color} flex items-center justify-center`}>
                <span className="text-[10px] opacity-40">:)</span>
              </div>
            )}
            <p className="text-sm font-medium">{user.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendeesPanel;