import { UserRound } from "lucide-react";
import { val } from "../utils";
import Detail from "./Detail";

export default function AccountOverview({ info, data, meterNo }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card backdrop-blur-md">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-md bg-cyan-bg p-2.5 text-cyan">
            <UserRound size={21} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[1.1rem] font-bold">
              {val(info, ["customerName", "name", "customerFullName"], "DESCO customer")}
            </h2>
            <p className="mt-.5 text-xs text-text-secondary">
              Account {val(info, ["accountNo", "accountNumber", "customerNo"])} · Meter{" "}
              {val(info, ["meterNo", "meterNumber"], meterNo || "—")}
            </p>{" "}
            <p className="mt-.5 text-xs text-text-secondary">
              {val(
                info,
                ["installationAddress"],
                val(data?.loc, ["address", "location", "customerLocation"], "Not available"),
              )}
            </p>{" "}
          </div>
        </div>
        <span className="w-fit rounded-full bg-cyan-bg px-3 py-1 text-xs font-semibold text-cyan">
          Prepaid meter
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Account number" value={val(info, ["accountNo", "accountNumber", "customerNo"])} />
        <Detail label="Contact number" value={val(info, ["contactNo", "mobileNo", "mobile", "phone"])} />

        <Detail label="Phase" value={val(info, ["phaseType"], "Not available")} />
        <Detail label="Tariff" value={val(info, ["tariffSolution"], "Not available")} />
        <Detail
          label="Sanctioned load"
          value={(() => {
            const load = val(info, ["sanctionLoad"], null);
            return load === null ? "Not available" : `${load} kW`;
          })()}
        />
        <Detail label="Feeder" value={val(info, ["feederName"], "Not available")} />
        <Detail label="SD name" value={val(info, ["SDName", "sdName"], "Not available")} />
      </div>
    </section>
  );
}
