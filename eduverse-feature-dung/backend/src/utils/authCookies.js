/**
 * Refresh Token cookie helpers (HttpOnly, chỉ gửi kèm các route /api/v1/auth)
 */
const baseCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/api/v1/auth'
});

export const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    ...baseCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', baseCookieOptions());
};

export default { setRefreshCookie, clearRefreshCookie };
