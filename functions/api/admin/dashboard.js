const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
  },
});

export async function onRequestGet(context) {
  try {
    const db = context.env.WEDDING_DB;
    const [rsvp, guestbook, activity] = await Promise.all([
      db.prepare(`
        SELECT
          COUNT(*) AS responses,
          SUM(CASE WHEN attendance='YES' THEN 1 ELSE 0 END) AS attending_responses,
          SUM(CASE WHEN attendance='NO' THEN 1 ELSE 0 END) AS declined_responses,
          COALESCE(SUM(CASE WHEN attendance='YES' THEN guest_count ELSE 0 END), 0) AS attending_people,
          COALESCE(SUM(CASE WHEN attendance='YES' AND side='GROOM' THEN guest_count ELSE 0 END), 0) AS groom_people,
          COALESCE(SUM(CASE WHEN attendance='YES' AND side='BRIDE' THEN guest_count ELSE 0 END), 0) AS bride_people,
          COALESCE(SUM(CASE WHEN attendance='YES' AND meal='YES' THEN guest_count ELSE 0 END), 0) AS meal_people,
          COALESCE(SUM(CASE WHEN attendance='YES' AND meal='UNKNOWN' THEN guest_count ELSE 0 END), 0) AS meal_unknown_people
        FROM rsvp WHERE status='ACTIVE'
      `).first(),
      db.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN visible=0 THEN 1 ELSE 0 END) AS hidden FROM guestbook WHERE status='ACTIVE'`).first(),
      db.prepare(`SELECT id, actor, action, entity_type, entity_id, summary, created_at FROM admin_audit_log ORDER BY created_at DESC LIMIT 10`).all(),
    ]);

    return json({
      ok: true,
      rsvp: rsvp ?? {},
      guestbook: guestbook ?? {},
      recentActivity: activity.results ?? [],
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ADMIN_DASHBOARD_FAILED', error);
    return json({ ok: false, error: 'INTERNAL_ERROR' }, 500);
  }
}
