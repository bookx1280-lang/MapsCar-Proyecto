export const ok = (res, data, code = 200) => res.status(code).json({ ok: true, data });
export const fail = (res, error, code = 400) => {
  const message = error instanceof Error ? error.message : String(error);
  return res.status(code).json({ ok: false, error: message });
};
