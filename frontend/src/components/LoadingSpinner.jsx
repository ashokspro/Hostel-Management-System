// src/components/LoadingSpinner.jsx

function LoadingSpinner({ text = 'Loading...' }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700
                            rounded-full animate-spin" />
            <p className="text-sm text-gray-500">{text}</p>
        </div>
    );
}

export default LoadingSpinner;