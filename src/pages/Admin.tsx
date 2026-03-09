import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Shield, Search, Gift, Crown, ArrowLeft } from "lucide-react";

const ADMIN_EMAIL = "seali870@gmail.com";

const PLAN_CONFIG: Record<string, { images_limit: number; label: string }> = {
  free_trial: { images_limit: 5, label: "Free Trial" },
  starter: { images_limit: 30, label: "Starter (30 images)" },
  pro: { images_limit: 100, label: "Pro (100 images)" },
  business: { images_limit: -1, label: "Business (Unlimited)" },
};

const GRANT_PLANS = ["starter", "pro", "business"] as const;

interface UserData {
  id: string;
  email: string;
  created_at: string;
  profile: {
    plan_type: string;
    images_used: number;
    images_limit: number;
  } | null;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantEmail, setGrantEmail] = useState("");
  const [granting, setGranting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) fetchUsers();
  }, [user]);

  const adminInvoke = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("admin", { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminInvoke({ action: "list_users" });
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error("Failed to load users: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantUnlimited = async () => {
    if (!grantEmail.trim()) return;
    setGranting(true);
    try {
      await adminInvoke({ action: "grant_unlimited", email: grantEmail.trim() });
      toast.success(`Unlimited access granted to ${grantEmail}`);
      setGrantEmail("");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGranting(false);
    }
  };

  const handleUpdatePlan = async (userId: string, planType: string) => {
    const config = PLAN_CONFIG[planType];
    if (!config) return;
    try {
      await adminInvoke({
        action: "update_plan",
        user_id: userId,
        plan_type: planType,
        images_limit: config.images_limit,
      });
      toast.success(`Plan updated to ${config.label}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredUsers = users.filter(
    (u) => u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.email !== ADMIN_EMAIL) return null;

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-background border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="font-display text-xl font-bold text-foreground">Admin Panel</h1>
            </div>
          </div>
          <Badge variant="destructive" className="text-xs">ADMIN</Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Grant Unlimited Access */}
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Grant Unlimited Access</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Enter a user's email to give them unlimited free access (Business plan).
          </p>
          <div className="flex gap-3">
            <Input
              placeholder="user@example.com"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGrantUnlimited()}
              className="max-w-sm"
            />
            <Button onClick={handleGrantUnlimited} disabled={granting || !grantEmail.trim()} className="btn-gradient">
              {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4 mr-1" />}
              Grant Access
            </Button>
          </div>
        </div>

        {/* User List */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-foreground">
              All Users ({users.length})
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchUsers}>
                Refresh
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.profile?.plan_type === "business" ? "default" : "secondary"} className="text-xs">
                          {PLAN_CONFIG[u.profile?.plan_type || "free_trial"]?.label || u.profile?.plan_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.profile?.images_used || 0} / {u.profile?.images_limit === -1 ? "∞" : u.profile?.images_limit || 5}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.profile?.plan_type || "free_trial"}
                          onValueChange={(val) => handleUpdatePlan(u.id, val)}
                        >
                          <SelectTrigger className="w-40 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PLAN_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key} className="text-xs">
                                {cfg.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        {searchQuery ? "No users match your search" : "No users found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
