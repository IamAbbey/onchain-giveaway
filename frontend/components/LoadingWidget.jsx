import { Loading } from "web3uikit";

export function LoadingWidget() {
  return (
    <>
      <div className="flex h-screen">
        <div className="mx-auto py-32">
          <Loading
            fontSize={14}
            size={18}
            spinnerColor="#2E7DAF"
            spinnerType="wave"
            text="Loading..."
          />
        </div>
      </div>
    </>
  );
}
