import { Skeleton } from "@/components/ui/skeleton";

export default function WalletSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 bg-black text-white rounded-xl w-full max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-md" /> {/* Main Wallet */}
        <Skeleton className="h-8 w-20 rounded-md" /> {/* Chain selector */}
      </div>

      {/* Balance Section */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-32 rounded-md" /> {/* Balance ~ $1593.50 */}
        <div className="flex items-baseline gap-2">
          <Skeleton className="h-10 w-28 rounded-md" /> {/* 10.00 */}
          <Skeleton className="h-6 w-12 rounded-md" /> {/* SOL */}
        </div>
        <Skeleton className="h-4 w-16 rounded-md" /> {/* +0.00% */}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-full rounded-lg" /> {/* Withdraw */}
        <Skeleton className="h-10 w-full rounded-lg" /> {/* Deposit */}
      </div>

      {/* Position Overview */}
      <div className="flex flex-col gap-3 mt-4">
        <Skeleton className="h-5 w-36 rounded-md" />{" "}
        {/* Position Overview title */}
        <div className="bg-[#111111] rounded-xl p-4 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24 rounded-md" /> {/* Token name */}
            <div className="flex gap-2 items-center">
              <Skeleton className="h-4 w-16 rounded-md" /> {/* MC */}
              <Skeleton className="h-4 w-12 rounded-md" /> {/* $0.00 */}
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />{" "}
          {/* Sell 100% button */}
        </div>
        <div className="bg-[#111111] rounded-xl p-4 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24 rounded-md" /> {/* Token name */}
            <div className="flex gap-2 items-center">
              <Skeleton className="h-4 w-16 rounded-md" /> {/* MC */}
              <Skeleton className="h-4 w-12 rounded-md" /> {/* $0.00 */}
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />{" "}
          {/* Sell 100% button */}
        </div>
        <div className="bg-[#111111] rounded-xl p-4 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24 rounded-md" /> {/* Token name */}
            <div className="flex gap-2 items-center">
              <Skeleton className="h-4 w-16 rounded-md" /> {/* MC */}
              <Skeleton className="h-4 w-12 rounded-md" /> {/* $0.00 */}
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />{" "}
          {/* Sell 100% button */}
        </div>
      </div>
    </div>
  );
}
