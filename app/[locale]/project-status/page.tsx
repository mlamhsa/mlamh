import { createServerSupabaseClient } from "@/lib/supabase/server";
import { updateProjectStatus } from "./actions";

type ProjectStatus = {
  id: string;
  feature: string;
  area: string;
  status: "completed" | "in_progress" | "pending" | "blocked";
  priority: string | null;
  notes: string | null;
  updated_at: string;
};

function StatusBadge({ status }: { status: ProjectStatus["status"] }) {
  const styles = {
    completed: "bg-green-100 text-green-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    pending: "bg-gray-100 text-gray-700",
    blocked: "bg-red-100 text-red-700",
  };

  const labels = {
    completed: "Completed",
    in_progress: "In Progress",
    pending: "Pending",
    blocked: "Blocked",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default async function ProjectStatusPage() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("project_status")
    .select("*")
    .order("area", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Project Status</h1>
        <p className="mt-4 text-red-600">Failed to load project status.</p>
      </main>
    );
  }

  const rows = (data ?? []) as ProjectStatus[];

  return (
    <main className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">MLAMH Project Status</h1>
        <p className="mt-2 text-muted-foreground">
          Live project progress tracker.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-background">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-4">Area</th>
              <th className="p-4">Feature</th>
              <th className="p-4">Current</th>
              <th className="p-4">Update</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Notes</th>
              <th className="p-4">Save</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t align-top">
                <td className="p-4 font-medium">{item.area}</td>
                <td className="p-4">{item.feature}</td>
                <td className="p-4">
                  <StatusBadge status={item.status} />
                </td>

                <form action={updateProjectStatus} className="contents">
                  <input type="hidden" name="id" value={item.id} />

                  <td className="p-4">
                    <select
                      name="status"
                      defaultValue={item.status}
                      className="rounded-md border bg-background px-3 py-2"
                    >
                      <option value="completed">Completed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="pending">Pending</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </td>

                  <td className="p-4 capitalize">{item.priority ?? "-"}</td>

                  <td className="p-4">
                    <textarea
                      name="notes"
                      defaultValue={item.notes ?? ""}
                      className="min-h-20 w-full rounded-md border bg-background px-3 py-2"
                    />
                  </td>

                  <td className="p-4">
                    <button
                      type="submit"
                      className="rounded-md bg-black px-4 py-2 text-white"
                    >
                      Save
                    </button>
                  </td>
                </form>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}