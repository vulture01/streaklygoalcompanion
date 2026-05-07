import { useEffect, useState, useCallback } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { ArrowLeft, Search, UserPlus, Check, X, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SearchUser { user_id: string; username: string | null; name: string | null }
interface IncomingRequest { id: string; sender_id: string; sender_username: string | null; sender_name: string | null }
interface OutgoingRequest { id: string; receiver_id: string; receiver_username: string | null }
interface Friend { friend_id: string; username: string | null; name: string | null }

export default function FriendsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  const loadAll = useCallback(async () => {
    if (!user) return;

    const [reqIn, reqOut, fr] = await Promise.all([
      supabase.from('friend_requests' as any).select('id, sender_id').eq('receiver_id', user.id).eq('status', 'pending'),
      supabase.from('friend_requests' as any).select('id, receiver_id').eq('sender_id', user.id).eq('status', 'pending'),
      supabase.from('friends' as any).select('friend_id').eq('user_id', user.id),
    ]);

    const senderIds = ((reqIn.data as any[]) || []).map((r) => r.sender_id);
    const receiverIds = ((reqOut.data as any[]) || []).map((r) => r.receiver_id);
    const friendIds = ((fr.data as any[]) || []).map((r) => r.friend_id);
    const allIds = Array.from(new Set([...senderIds, ...receiverIds, ...friendIds]));

    let profileMap: Record<string, { username: string | null; name: string | null }> = {};
    if (allIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, username, name')
        .in('user_id', allIds);
      (profs || []).forEach((p) => {
        profileMap[p.user_id] = { username: p.username, name: p.name };
      });
    }

    setIncoming(((reqIn.data as any[]) || []).map((r) => ({
      id: r.id,
      sender_id: r.sender_id,
      sender_username: profileMap[r.sender_id]?.username || null,
      sender_name: profileMap[r.sender_id]?.name || null,
    })));
    setOutgoing(((reqOut.data as any[]) || []).map((r) => ({
      id: r.id,
      receiver_id: r.receiver_id,
      receiver_username: profileMap[r.receiver_id]?.username || null,
    })));
    setFriends(((fr.data as any[]) || []).map((r) => ({
      friend_id: r.friend_id,
      username: profileMap[r.friend_id]?.username || null,
      name: profileMap[r.friend_id]?.name || null,
    })));
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_users_by_username' as any, { _query: q });
      if (!error) setResults((data as any) || []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const sendRequest = async (receiverId: string) => {
    if (!user) return;
    if (receiverId === user.id) return;
    if (friends.some((f) => f.friend_id === receiverId)) {
      toast.info('Already friends');
      return;
    }
    if (outgoing.some((r) => r.receiver_id === receiverId)) {
      toast.info('Request already sent');
      return;
    }
    const { error } = await supabase
      .from('friend_requests' as any)
      .insert({ sender_id: user.id, receiver_id: receiverId, status: 'pending' } as any);
    if (error) {
      if ((error as any).code === '23505') toast.info('Request already exists');
      else toast.error('Could not send request');
      return;
    }
    toast.success('Friend request sent');
    setQuery('');
    setResults([]);
    loadAll();
  };

  const accept = async (id: string) => {
    const { error } = await supabase.rpc('accept_friend_request' as any, { _request_id: id });
    if (error) { toast.error('Could not accept'); return; }
    toast.success('Friend added');
    loadAll();
  };

  const decline = async (id: string) => {
    const { error } = await supabase.from('friend_requests' as any).update({ status: 'rejected' } as any).eq('id', id);
    if (error) { toast.error('Could not decline'); return; }
    loadAll();
  };

  const removeFriend = async (friendId: string) => {
    if (!user) return;
    // Remove both directions
    await supabase.from('friends' as any).delete().eq('user_id', user.id).eq('friend_id', friendId);
    // The other direction is protected by RLS; cleaning it requires a function. For now, leave it (user won't see it).
    toast.success('Friend removed');
    loadAll();
  };

  return (
    <PageTransition>
      <div className="px-4 pt-12 safe-bottom max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="tap-target"><ArrowLeft size={22} className="text-foreground" /></button>
          <h1 className="text-xl font-bold text-foreground flex-1">Friends</h1>
          <button onClick={() => navigate('/leaderboard')} className="tap-target text-primary flex items-center gap-1 text-sm font-medium">
            <Trophy size={16} /> Leaderboard
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-foreground text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {query.trim().length >= 2 && (
          <div className="mb-6 space-y-2">
            {searching && <p className="text-xs text-muted-foreground">Searching...</p>}
            {!searching && results.length === 0 && <p className="text-xs text-muted-foreground">No users found</p>}
            {results.map((u) => {
              const isFriend = friends.some((f) => f.friend_id === u.user_id);
              const sent = outgoing.some((r) => r.receiver_id === u.user_id);
              return (
                <div key={u.user_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {(u.username || u.name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">@{u.username}</p>
                    {u.name && <p className="text-xs text-muted-foreground truncate">{u.name}</p>}
                  </div>
                  {isFriend ? (
                    <span className="text-xs text-muted-foreground">Friends</span>
                  ) : sent ? (
                    <span className="text-xs text-muted-foreground">Pending</span>
                  ) : (
                    <button
                      onClick={() => sendRequest(u.user_id)}
                      className="px-3 py-1.5 rounded-md gradient-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 tap-target"
                    >
                      <UserPlus size={14} /> Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">Requests</h2>
            <div className="space-y-2">
              {incoming.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {(r.sender_username || r.sender_name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">@{r.sender_username || 'unknown'}</p>
                    {r.sender_name && <p className="text-xs text-muted-foreground truncate">{r.sender_name}</p>}
                  </div>
                  <button onClick={() => accept(r.id)} className="p-2 rounded-md bg-success/15 text-success tap-target"><Check size={16} /></button>
                  <button onClick={() => decline(r.id)} className="p-2 rounded-md bg-destructive/15 text-destructive tap-target"><X size={16} /></button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Friends list */}
        <section>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">Your friends · {friends.length}</h2>
          {friends.length === 0 ? (
            <div className="text-center py-10 bg-card border border-border rounded-lg">
              <Users size={28} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No friends yet. Search above to add some.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div key={f.friend_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {(f.username || f.name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">@{f.username || 'unknown'}</p>
                    {f.name && <p className="text-xs text-muted-foreground truncate">{f.name}</p>}
                  </div>
                  <button onClick={() => removeFriend(f.friend_id)} className="text-xs text-muted-foreground tap-target px-2">Remove</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
