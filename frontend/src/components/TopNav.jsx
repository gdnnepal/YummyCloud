import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { HiOutlineChevronLeft } from 'react-icons/hi2';

function TopNav({ title, showBack = true, rightAction = null }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `${title} - CloudKitchen`;
  }, [title]);

  return (
    <header className="sticky top-0 z-50 bg-primary">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left - Back Button */}
        <div className="w-10">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all"
              aria-label="Go back"
            >
              <HiOutlineChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Center - Title */}
        <h1 className="text-base font-semibold text-white truncate">
          {title}
        </h1>

        {/* Right - Optional Action */}
        <div className="w-10 flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  );
}

export default TopNav;
