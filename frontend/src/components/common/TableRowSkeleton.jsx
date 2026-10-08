import React from 'react';
import Skeleton from './Skeleton';

export default function TableRowSkeleton({ rows = 5, columns = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex}>
              <Skeleton 
                width={colIndex === columns - 1 ? '40%' : '80%'} 
                height="18px" 
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
