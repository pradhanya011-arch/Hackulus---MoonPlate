/* ==================================================================
   MoonPlate — Login module
   Owner: Person 1 (frontend)

   Exports a single <Login /> component. It handles role selection,
   student sign-in and administrator sign-in, and calls onLogin(session)
   once credentials are accepted.

   Integration point for the team:
   authService below is the ONLY place that talks to a server. Replace
   its two function bodies with real calls once Person 2's endpoints
   and Person 4's JWT issuing are ready. Nothing else in this file
   needs to change.
================================================================== */

import { useState } from "react";
import {
  ArrowLeft, Check, ChevronRight, AlertCircle,
  GraduationCap, ShieldCheck, Eye, EyeOff, Loader2,
} from "lucide-react";
import watermark from "./assets/watermark-light.png";
import logo from "./assets/vit-nightmess-logo.png";
/* ------------------------------------------------------------------
   Design tokens
------------------------------------------------------------------ */
const T = {
  bg: "#0B1326",
  surface: "#141E38",
  raised: "#1B2745",
  line: "#27344F",
  lineSoft: "#1E2A45",
  gold: "#D9A72E",
  goldSoft: "rgba(217,167,46,0.10)",
  text: "#EDF1F8",
  body: "#B9C4D8",
  muted: "#7E8CA8",
  danger: "#D96A5B",
  dangerSoft: "rgba(217,106,91,0.10)",
};

const R = { sm: 6, md: 8, lg: 10 };
const FONT = '"Segoe UI", Inter, system-ui, -apple-system, sans-serif';

/* ------------------------------------------------------------------
   Reference data
   Swap for GET /api/hostels and GET /api/messes when available.
------------------------------------------------------------------ */
export const HOSTELS = {
  "Men's Hostel": ["A Block", "B Block", "D Block", "K Block", "M Block", "Q Block", "T Block"],
  "Ladies Hostel": ["A Block", "C Block", "D Block", "E Block", "H Block", "K Block"],
};

export const MESSES_BY_HOSTEL = {
  "Men's Hostel": [
    { id: "safire", name: "Safire", tag: "North Indian" },
    { id: "zenith", name: "Zenith", tag: "South Indian" },
    { id: "crimson", name: "Crimson", tag: "Chinese and rolls" },
  ],
  "Ladies Hostel": [
    { id: "mayuri", name: "Mayuri", tag: "Multi-cuisine" },
    { id: "aryaas", name: "Aryaas", tag: "South Indian" },
    { id: "shakthi", name: "Shakthi", tag: "North Indian" },
  ],
};

/* Every block in a hostel is served by the same three messes. */
export const messesFor = (hostel) => MESSES_BY_HOSTEL[hostel] ?? [];

/* Flat list, used by the administrator screen. */
export const ALL_MESSES = Object.values(MESSES_BY_HOSTEL).flat();

/* Order code prefix: Ladies Hostel H -> LHH, Men's Hostel T -> MHT */
export const blockCode = (hostelType, block) =>
  (hostelType === "Ladies Hostel" ? "LH" : "MH") + block.charAt(0);

/* ------------------------------------------------------------------
   Validation — kept separate so it can be unit tested
------------------------------------------------------------------ */
export const REG_PATTERN = /^\d{2}[A-Z]{3}\d{4}$/;
export const isValidReg = (v) => REG_PATTERN.test(v.trim());
export const isValidStaffId = (v) => /^[A-Z]{2,6}-\d{2,4}$/.test(v.trim());

/* ------------------------------------------------------------------
   AUTH SERVICE — the team's integration seam
------------------------------------------------------------------ */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const authService = {
  /*
    Replace with:
      const res = await fetch("/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNo, hostel, block, messId }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();   // { token, student: {...} }
  */
  async studentLogin({ regNo, hostel, block, messId }) {
    await wait(650);
    if (regNo === "00XXX0000") {
      throw new Error("This register number is not enrolled for night mess.");
    }
    return {
      token: "demo-token",
      role: "student",
      regNo,
      hostel,
      block,
      messId,
      codePrefix: blockCode(hostel, block),
    };
  },

  /*
    Replace with POST /api/auth/admin. Never compare a PIN in the
    browser — the server verifies a bcrypt hash and returns a JWT.
  */
  async adminLogin({ staffId, pin, messId }) {
    await wait(650);
    if (pin !== "1234") {
      throw new Error("The staff ID and PIN do not match a registered account.");
    }
    return { token: "demo-token", role: "admin", staffId, messId };
  },
};

/* ==================================================================
   UI PRIMITIVES
================================================================== */
function Mark({ size = 70}) {
  return (
    <img
      src={logo}
      alt="MoonPlate"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}

function Label({ children, hint, htmlFor }) {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <label htmlFor={htmlFor} className="text-sm font-medium" style={{ color: T.body }}>
        {children}
      </label>
      {hint && <span className="text-xs" style={{ color: T.muted }}>{hint}</span>}
    </div>
  );
}

function TextInput({ invalid, trailing, id, ...props }) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        id={id}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        aria-invalid={invalid || undefined}
        className="w-full text-base outline-none"
        style={{
          height: 46,
          paddingLeft: 12,
          paddingRight: trailing ? 42 : 12,
          background: T.bg,
          border: `1px solid ${invalid ? T.danger : focus ? T.gold : T.line}`,
          borderRadius: R.md,
          color: T.text,
        }}
      />
      {trailing && (
        <div className="absolute" style={{ right: 10, top: 12 }}>{trailing}</div>
      )}
    </div>
  );
}

function Select({ id, value, onChange, placeholder, options, disabled }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-3 text-base outline-none appearance-none"
        style={{
          height: 46,
          background: disabled ? T.surface : T.bg,
          border: `1px solid ${T.line}`,
          borderRadius: R.md,
          color: value ? T.text : T.muted,
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}
                  style={{ background: T.surface, color: T.text }}>
            {o.label ?? o}
          </option>
        ))}
      </select>
      <ChevronRight size={16} className="absolute pointer-events-none"
                    style={{ right: 12, top: 15, color: T.muted, transform: "rotate(90deg)" }} />
    </div>
  );
}

function Button({ children, onClick, disabled, busy, variant = "primary", full }) {
  const styles = {
    primary: {
      background: disabled || busy ? T.raised : T.gold,
      color: disabled || busy ? T.muted : T.bg,
      border: "none",
    },
    secondary: { background: "transparent", color: T.body, border: `1px solid ${T.line}` },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className={`${full ? "w-full" : ""} flex items-center justify-center gap-2 text-sm font-semibold`}
      style={{ height: 46, borderRadius: R.md, ...styles }}
    >
      {busy && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return (
    <p className="flex items-start gap-1.5 text-xs" style={{ color: T.danger, marginTop: 6 }}>
      <AlertCircle size={12} style={{ marginTop: 1, flexShrink: 0 }} />
      {children}
    </p>
  );
}

function FormError({ children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2 px-3 py-2.5"
         role="alert"
         style={{ background: T.dangerSoft, borderRadius: R.md, marginBottom: 20 }}>
      <AlertCircle size={14} style={{ color: T.danger, marginTop: 1, flexShrink: 0 }} />
      <p className="text-xs" style={{ color: T.danger, lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}

function TopBar({ title, onBack }) {
  return (
    <div className="flex items-center gap-3 px-5"
         style={{ height: 60, background: T.surface, borderBottom: `1px solid ${T.lineSoft}` }}>
      <button onClick={onBack} aria-label="Back" className="-ml-1">
        <ArrowLeft size={19} style={{ color: T.body }} />
      </button>
      <p className="text-base font-semibold" style={{ color: T.text }}>{title}</p>
    </div>
  );
}

function Footer() {
  return (
    <p className="text-xs text-center" style={{ color: T.muted, marginTop: 28, paddingBottom: 32 }}>
      Vellore Institute of Technology · Hostel Services
    </p>
  );
}

/* ==================================================================
   STEP 1 — role selection
================================================================== */
function RoleStep({ onPick }) {
  const roles = [
    { id: "student", title: "Student", line: "Place orders at your hostel mess", Icon: GraduationCap },
    { id: "admin", title: "Mess administrator", line: "Manage menu, stock and orders", Icon: ShieldCheck },
  ];

  return (
    <div className="px-6" style={{ paddingTop: 72 }}>
      <Mark />
      <h1 className="mt-5 text-2xl font-semibold" style={{ color: T.text, letterSpacing: "-0.01em" }}>
        MoonPlate
      </h1>
      <p className="mt-1.5 text-sm" style={{ color: T.muted, lineHeight: 1.6 }}>
        Night mess ordering for VIT Vellore hostels. Service runs from 8:00 pm to 1:30 am.
      </p>

      <div style={{ marginTop: 40 }}>
        <Label>Select your role</Label>
        {roles.map(({ id, title, line, Icon }) => (
          <button
            key={id}
            onClick={() => onPick(id)}
            className="flex items-center w-full gap-3.5 px-4 text-left"
            style={{
              minHeight: 72, marginBottom: 10,
              background: T.surface, border: `1px solid ${T.lineSoft}`, borderRadius: R.lg,
            }}
          >
            <div className="flex items-center justify-center shrink-0"
                 style={{ width: 38, height: 38, borderRadius: R.md, background: T.raised }}>
              <Icon size={18} style={{ color: T.gold }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: T.text }}>{title}</p>
              <p className="mt-0.5 text-xs" style={{ color: T.muted }}>{line}</p>
            </div>
            <ChevronRight size={16} style={{ color: T.muted }} />
          </button>
        ))}
      </div>

      <Footer />
    </div>
  );
}

/* ==================================================================
   STEP 2a — student sign in
================================================================== */
function StudentStep({ onBack, onLogin }) {
  const [regNo, setRegNo] = useState("");
  const [hostel, setHostel] = useState("");
  const [block, setBlock] = useState("");
  const [messId, setMessId] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const regError = touched && regNo.length > 0 && !isValidReg(regNo)
    ? "Enter a register number in the format 23BCE1001."
    : "";

  const complete = isValidReg(regNo) && hostel && block && messId;

  const submit = async () => {
    setTouched(true);
    if (!complete) return;
    setFormError("");
    setBusy(true);
    try {
      const session = await authService.studentLogin({ regNo, hostel, block, messId });
      onLogin(session);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <TopBar title="Student sign in" onBack={onBack} />
      <div className="px-5" style={{ paddingTop: 24 }}>
        <FormError>{formError}</FormError>

        <div style={{ marginBottom: 20 }}>
          <Label htmlFor="reg" hint="Required">Register number</Label>
          <TextInput
            id="reg"
            value={regNo}
            onChange={(e) => { setRegNo(e.target.value.toUpperCase()); setFormError(""); }}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="23BCE1001"
            autoComplete="username"
            maxLength={9}
            invalid={!!regError}
          />
          <FieldError>{regError}</FieldError>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Label htmlFor="hostel">Hostel</Label>
          <Select
            id="hostel"
            value={hostel}
            onChange={(e) => { setHostel(e.target.value); setBlock(""); setMessId(""); }}            placeholder="Select hostel"
            options={Object.keys(HOSTELS)}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <Label htmlFor="block">Block</Label>
          <Select
            id="block"
            value={block}
            onChange={(e) => setBlock(e.target.value)}
            placeholder={hostel ? "Select block" : "Select a hostel first"}
            options={hostel ? HOSTELS[hostel] : []}
            disabled={!hostel}
          />
          {hostel && block && (
            <p className="text-xs" style={{ color: T.muted, marginTop: 6 }}>
              Your orders will be numbered {blockCode(hostel, block)}001 onwards.
            </p>
          )}
        </div>

                <div style={{ marginBottom: 24 }}>
          <Label hint={hostel ? "Serves every block" : "Select a hostel first"}>Mess</Label>
          {!hostel ? (
            <div className="flex items-center px-4"
                 style={{ height: 52, background: T.surface,
                          border: `1px solid ${T.lineSoft}`, borderRadius: R.md }}>
              <span className="text-sm" style={{ color: T.muted }}>
                Choose a hostel to see its messes.
              </span>
            </div>
          ) : (
            messesFor(hostel).map((m) => {
              const on = messId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMessId(m.id)}
                  className="flex items-center w-full gap-3 px-4"
                  style={{
                    height: 52, marginBottom: 8,
                    background: on ? T.raised : T.surface,
                    border: `1px solid ${on ? T.gold : T.lineSoft}`,
                    borderRadius: R.md,
                  }}
                >
                  <span className="flex-1 text-sm font-medium text-left"
                        style={{ color: on ? T.text : T.body }}>
                    {m.name}
                  </span>
                  <span className="text-xs" style={{ color: T.muted }}>{m.tag}</span>
                  {on && <Check size={15} style={{ color: T.gold }} />}
                </button>
              );
            })
          )}
        </div>

        <Button full busy={busy} disabled={touched && !complete} onClick={submit}>
          {busy ? "Signing in" : "Continue"}
        </Button>

        <p className="text-xs text-center" style={{ color: T.muted, marginTop: 16 }}>
          Sign in with the register number printed on your ID card.
        </p>

        <Footer />
      </div>
    </div>
  );
}

/* ==================================================================
   STEP 2b — administrator sign in
================================================================== */
function AdminStep({ onBack, onLogin }) {
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [messId, setMessId] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const idError = touched && staffId.length > 0 && !isValidStaffId(staffId)
    ? "Staff IDs look like MESS-014."
    : "";

  const complete = isValidStaffId(staffId) && pin.length >= 4 && messId;

  const submit = async () => {
    setTouched(true);
    if (!complete) return;
    setFormError("");
    setBusy(true);
    try {
      const session = await authService.adminLogin({ staffId, pin, messId });
      onLogin(session);
    } catch (err) {
      setFormError(err.message);
      setPin("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <TopBar title="Administrator sign in" onBack={onBack} />
      <div className="px-5" style={{ paddingTop: 24 }}>
        <FormError>{formError}</FormError>

        <div style={{ marginBottom: 20 }}>
          <Label htmlFor="staff">Staff ID</Label>
          <TextInput
            id="staff"
            value={staffId}
            onChange={(e) => { setStaffId(e.target.value.toUpperCase()); setFormError(""); }}
            onBlur={() => setTouched(true)}
            placeholder="MESS-014"
            autoComplete="username"
            invalid={!!idError}
          />
          <FieldError>{idError}</FieldError>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Label htmlFor="pin">PIN</Label>
          <TextInput
            id="pin"
            type={showPin ? "text" : "password"}
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setFormError(""); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Enter 4-digit PIN"
            autoComplete="current-password"
            inputMode="numeric"
            maxLength={6}
            trailing={
              <button onClick={() => setShowPin((s) => !s)}
                      aria-label={showPin ? "Hide PIN" : "Show PIN"}>
                {showPin
                  ? <EyeOff size={16} style={{ color: T.muted }} />
                  : <Eye size={16} style={{ color: T.muted }} />}
              </button>
            }
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <Label htmlFor="mess">Assigned mess</Label>
          <Select
            id="mess"
            value={messId}
            onChange={(e) => setMessId(e.target.value)}
            placeholder="Select mess"
            options={ALL_MESSES.map((m) => ({ value: m.id, label: m.name }))}          />
        </div>

        <Button full busy={busy} disabled={touched && !complete} onClick={submit}>
          {busy ? "Signing in" : "Sign in"}
        </Button>

        <p className="text-xs text-center" style={{ color: T.muted, marginTop: 16, lineHeight: 1.6 }}>
          Accounts are issued by Hostel Services. Contact the mess office to reset a PIN.
        </p>

        <Footer />
      </div>
    </div>
  );
}

/* ==================================================================
   PUBLIC COMPONENT

   Usage:
     <Login onLogin={(session) => setSession(session)} />

   session is one of:
     { token, role: "student", regNo, hostel, block, messId, codePrefix }
     { token, role: "admin", staffId, messId }
================================================================== */
export default function Login({ onLogin = () => {} }) {
  const [step, setStep] = useState("role");

  const body =
    step === "role" ? <RoleStep onPick={setStep} />
    : step === "student" ? <StudentStep onBack={() => setStep("role")} onLogin={onLogin} />
    : <AdminStep onBack={() => setStep("role")} onLogin={onLogin} />;

  return (
        <div
      style={{
        background: T.bg,
        backgroundImage: `url(${watermark})`,        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        fontFamily: FONT,
      }}
    >
      <div className="max-w-md mx-auto" style={{ minHeight: "100vh" }}>
        {body}
      </div>
    </div>
  );
}
