import React, { useState } from "react";
import { supabase } from "../../src/utils/supabaseClient";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}


const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword)
      return setError("Please fill in all fields");

    if (newPassword !== confirmNewPassword)
      return setError("New passwords do not match");

    setLoading(true);

    try {
      // Get logged-in user email
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.email) {
        setLoading(false);
        return setError("User is not logged in.");
      }

      // Re-authenticate user using old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        setLoading(false);
        return setError("Old password is incorrect.");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setLoading(false);
        return setError(updateError.message);
      }

      setSuccess("Password updated successfully!");
    } catch (err) {
      setError("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl space-y-4">
        <h2 className="text-xl font-semibold">Change Password</h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <input
          type="password"
          placeholder="Current Password"
          className="w-full border p-3 rounded-lg"
          onChange={(e) => setOldPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="New Password"
          className="w-full border p-3 rounded-lg"
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full border p-3 rounded-lg"
          onChange={(e) => setConfirmNewPassword(e.target.value)}
        />

        <button
          onClick={handleChangePassword}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg mt-3 font-semibold"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        <button
          onClick={onClose}
          className="w-full text-slate-600 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
