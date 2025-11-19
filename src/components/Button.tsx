export default function Button({
                                   children,
                                   onClick,
                                   variant = "primary", // primary, secondary, danger
                                   className = "",
                                   disabled = false,
                                   icon,
                                   fullWidth = false,
                                   type = "button"
                               }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "danger";
    className?: string;
    disabled?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    type?: "button" | "submit" | "reset";
}) {
    const baseStyle = "px-4 py-2 rounded-lg inline-flex items-center justify-center disabled:opacity-50";

    const variantStyles = {
        primary: "bg-rose-500 hover:bg-rose-600 text-white",
        secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200",
        danger: "bg-red-500 hover:bg-red-600 text-white"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
}