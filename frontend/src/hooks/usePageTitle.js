// src/hooks/usePageTitle.js

import { useEffect } from 'react';

function usePageTitle(title) {
    useEffect(() => {
        document.title = title ? `${title} | Hostel MS` : 'Hostel MS';
    }, [title]);
}

export default usePageTitle;