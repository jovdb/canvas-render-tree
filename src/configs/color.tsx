/** Component to select a color */
export function ColorConfig({
  color,
  onChange,
}: {
  color: string;
  onChange: (color: string) => void;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
    }}>
      <input
        value={color}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
      <input
        type="color"
        value={color}
        style={{
          width: "1.8rem",
          height: "2rem",
          appearance: "none",
          padding: 0,
          border: 0,
          marginLeft: "0.5rem",
          cursor: "pointer",
        }}
        onChange={(e) => {
          onChange(e.target.value);
        }}
      />
    </div>
  );
}
