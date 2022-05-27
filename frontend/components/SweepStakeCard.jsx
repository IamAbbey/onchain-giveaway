import { Card, Illustration } from "web3uikit";
import Countdown from "react-countdown";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useRouter } from "next/router";

dayjs.extend(isSameOrBefore);

export function SweepStakeCard(props) {
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
          dayjs.unix(sweepStake.startDateTime).isSameOrBefore(dayjs()) ? (
            <Countdown
              date={dayjs.unix(sweepStake.endDateTime).toDate()}
            ></Countdown>
          ) : (
            <b>Yet to start</b>
          )
        }
      >
        <div>
          <Illustration height="180px" logo="chest" width="100%" />
        </div>
      </Card>
    </div>
  );
}
