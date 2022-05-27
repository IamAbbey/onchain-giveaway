import { Card, Illustration } from "web3uikit";
import Countdown from "react-countdown";
import dayjs from "dayjs";
import { useRouter } from "next/router";

export function SweepStakeTable(props) {
  const { sweepStake } = props;
  const router = useRouter();
  return (
    <div>
      <Card
        onClick={() => router.push(`sweepstakes/${props.index}`)}
        setIsSelected={function noRefCheck() {}}
        title={`${sweepStake.title} (${sweepStake.entrants.length})`}
        tooltipText={`SweepStake: ${sweepStake.title}`}
        isDisabled={!sweepStake.isActive}
        description={
          <Countdown
            date={dayjs.unix(sweepStake.endDateTime).toDate()}
          ></Countdown>
        }
      >
        <div>
          <Illustration height="180px" logo="chest" width="100%" />
        </div>
      </Card>
    </div>
  );
}
