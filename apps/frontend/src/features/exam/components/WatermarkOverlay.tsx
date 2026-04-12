export function WatermarkOverlay({
  candidateName,
  candidateId,
  ipAddress
}: {
  candidateName: string;
  candidateId: string;
  ipAddress: string;
}) {
  const timestamp = new Date().toLocaleString();

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden opacity-15">
      <div className="grid h-full grid-cols-2 gap-12 p-10 md:grid-cols-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="rotate-[-22deg] text-xs font-semibold uppercase tracking-[0.18em] text-stone-700"
          >
            <div>{candidateName}</div>
            <div>{candidateId}</div>
            <div>{ipAddress}</div>
            <div>{timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
