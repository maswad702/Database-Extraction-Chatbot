// Alert.js
const Alert = ({ children, variant }) => {
    const baseClass = "alert-container " + (variant === "destructive" ? "alert-error" : "alert-info");
    return (
      <div className={baseClass}>
        {children}
      </div>
    );
  };
  
  const AlertDescription = ({ children }) => {
    return <div className="alert-description">{children}</div>;
  };