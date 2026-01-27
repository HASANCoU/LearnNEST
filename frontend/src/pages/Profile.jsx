import { useState, useEffect } from "react";
import { http } from "../api/http";
import { getUser, setUser } from "../auth/auth";

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });
    const [user, setUserState] = useState(null);
    const [form, setForm] = useState({
        name: "",
        phone: "",
        bio: "",
        address: "",
        dateOfBirth: "",
        gender: "",
    });

    const loadProfile = async () => {
        setLoading(true);
        try {
            const { data } = await http.get("/api/users/me");
            setUserState(data.user);
            setForm({
                name: data.user.name || "",
                phone: data.user.phone || "",
                bio: data.user.bio || "",
                address: data.user.address || "",
                dateOfBirth: data.user.dateOfBirth ? new Date(data.user.dateOfBirth).toISOString().split("T")[0] : "",
                gender: data.user.gender || "",
            });
        } catch (err) {
            setMsg({ type: "error", text: err?.response?.data?.message || "Failed to load profile" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg({ type: "", text: "" });
        try {
            const payload = { ...form };
            if (form.dateOfBirth) {
                payload.dateOfBirth = new Date(form.dateOfBirth).toISOString();
            } else {
                delete payload.dateOfBirth;
            }
            const { data } = await http.patch("/api/users/me", payload);
            setUserState(data.user);
            // Update local storage
            const currentUser = getUser();
            if (currentUser) {
                setUser({ ...currentUser, name: data.user.name, avatarUrl: data.user.avatarUrl });
            }
            setMsg({ type: "success", text: "Profile updated successfully!" });
        } catch (err) {
            setMsg({ type: "error", text: err?.response?.data?.message || "Failed to update profile" });
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("avatar", file);

        setUploading(true);
        setMsg({ type: "", text: "" });
        try {
            const { data } = await http.post("/api/users/me/avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setUserState(data.user);
            // Update local storage
            const currentUser = getUser();
            if (currentUser) {
                setUser({ ...currentUser, avatarUrl: data.user.avatarUrl });
            }
            setMsg({ type: "success", text: "Avatar uploaded successfully!" });
        } catch (err) {
            setMsg({ type: "error", text: err?.response?.data?.message || "Failed to upload avatar" });
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <p className="text-slate-400">Loading profile...</p>
            </div>
        );
    }

    const avatarSrc = user?.avatarUrl
        ? user.avatarUrl.startsWith("http")
            ? user.avatarUrl
            : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${user.avatarUrl}`
        : null;

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                <p className="text-slate-400 mb-8">Manage your account information</p>

                {msg.text && (
                    <div
                        className={`p-4 rounded-lg mb-6 ${msg.type === "error"
                                ? "bg-red-900/30 border border-red-700 text-red-300"
                                : "bg-green-900/30 border border-green-700 text-green-300"
                            }`}
                    >
                        {msg.text}
                    </div>
                )}

                {/* Avatar Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            {avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt="Profile"
                                    className="w-24 h-24 rounded-full object-cover border-2 border-slate-700"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold">
                                    {user?.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="cursor-pointer">
                                <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors inline-block">
                                    {uploading ? "Uploading..." : "Change Photo"}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    disabled={uploading}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-slate-400 text-xs mt-2">JPG, PNG, GIF. Max 2MB</p>
                        </div>
                    </div>
                </div>

                {/* Account Info */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Account Information</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-slate-400">Email</span>
                            <p className="font-medium">{user?.email}</p>
                        </div>
                        <div>
                            <span className="text-slate-400">Role</span>
                            <p className="font-medium capitalize">{user?.role}</p>
                        </div>
                        <div>
                            <span className="text-slate-400">Member Since</span>
                            <p className="font-medium">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400">Status</span>
                            <p className="font-medium">{user?.isActive ? "Active" : "Inactive"}</p>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Bio</label>
                            <textarea
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                rows={3}
                                maxLength={500}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                                placeholder="Tell us about yourself..."
                            />
                            <p className="text-xs text-slate-500 mt-1">{form.bio.length}/500 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Address</label>
                            <input
                                type="text"
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                placeholder="Your address"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={form.dateOfBirth}
                                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Gender</label>
                                <select
                                    value={form.gender}
                                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
