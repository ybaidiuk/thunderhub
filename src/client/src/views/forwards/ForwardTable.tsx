import { FC } from 'react';
import { toast } from 'react-toastify';
import { ProgressBar } from '../../components/generic/CardGeneric';
import { SingleLine } from '../../components/generic/Styled';
import { getPrice } from '../../components/price/Price';
import { useConfigState } from '../../context/ConfigContext';
import { usePriceState } from '../../context/PriceContext';
import { useGetForwardsQuery } from '../../graphql/queries/__generated__/getForwards.generated';
import { Forward } from '../../graphql/types';
import { getErrorContent } from '../../utils/error';
import { sortByNode } from './helpers';
import Table from '../../components/table';

const getBar = (top: number, bottom: number) => {
  const percent = (top / bottom) * 100;
  return Math.min(percent, 100);
};

const SingleBar = ({ value, height }: { value: number; height: number }) => {
  const opposite = 100 - value;

  return (
    <SingleLine>
      <ProgressBar barHeight={height} order={9} percent={value} />
      <ProgressBar barHeight={height} order={8} percent={opposite} />
    </SingleLine>
  );
};

export const ForwardTable: FC<{ days: number; order: string }> = ({
  days,
  order,
}) => {
  const { data, loading } = useGetForwardsQuery({
    ssr: false,
    variables: { days },
    onError: error => toast.error(getErrorContent(error)),
  });

  const { currency, displayValues } = useConfigState();
  const priceContext = usePriceState();
  const format = getPrice(currency, displayValues, priceContext);

  if (loading || !data?.getForwards?.length) {
    return null;
  }

  const { final, maxIn, maxOut } = sortByNode(
    order,
    data.getForwards as Forward[]
  );

  const columns = [
    {
      header: 'Alias',
      accessorKey: 'alias',
      cell: ({ cell }: any) => cell.renderValue(),
    },
    {
      header: 'Channel',
      accessorKey: 'channel',
      cell: ({ cell }: any) => cell.renderValue(),
    },
    {
      header: 'Incoming',
      accessorKey: 'incoming',
      cell: ({ cell }: any) => cell.renderValue(),
    },
    {
      header: 'Outgoing',
      accessorKey: 'outgoing',
      cell: ({ cell }: any) => cell.renderValue(),
    },
    {
      header: 'Incoming',
      accessorKey: 'incomingBar',
      cell: ({ cell }: any) => cell.renderValue(),
    },
    {
      header: 'Outgoing',
      accessorKey: 'outgoingBar',
      cell: ({ cell }: any) => cell.renderValue(),
    },
  ];

  const tableData = final.map(f => ({
    ...f,
    incoming: format({ amount: f.incoming, noUnit: order === 'amount' }),
    outgoing: format({ amount: f.outgoing, noUnit: order === 'amount' }),
    incomingBar: <SingleBar value={getBar(f.incoming, maxIn)} height={16} />,
    outgoingBar: <SingleBar value={getBar(f.outgoing, maxOut)} height={16} />,
  }));

  return <Table data={tableData} columns={columns} withSorting={true} />;
};
