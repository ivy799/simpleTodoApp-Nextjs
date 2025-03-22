export const fetcher = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
  
    if (res.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
  
    return res;
  };