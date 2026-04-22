import { logoutAction } from "@/app/actions/auth";

type Props = {
  user: { name: string; email: string };
};

export function TopBar({ user }: Props) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 md:px-10">
      <div className="text-sm text-zinc-500">
        Signed in as{" "}
        <span className="font-medium text-zinc-900">{user.name}</span>
        <span className="ml-2 hidden text-zinc-400 md:inline">{user.email}</span>
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
