export default function OwnerNote({ who, folder }: { who: string; folder: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-[#c4a46c] bg-[#fff6e8] px-4 py-3 text-sm text-[#5c4638]">
      <strong>{who}</strong> builds this page. Folder: <code>{folder}</code>.
      Other people should not edit it.
    </p>
  );
}
