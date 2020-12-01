import React from "react";
import Link from 'next/link';

export const getLinkData = billingGroupSlug => ({
  urlObject: {
    pathname: '/admin/billing',
    query: { billingGroupName: billingGroupSlug }
  },
  asPath: `/admin/billing/${billingGroupSlug}`
});

/**
 * Links to the billingGroup page given the billingGroup name.
 */
const BillingGroupLink = ({ billingGroupSlug, children, className = null, prefetch = false }) => {
  const { urlObject: { pathname }, asPath } = getLinkData(billingGroupSlug);
  return (
    <Link href={asPath} as={asPath} prefetch={prefetch}>
      <a className={className}>{children}</a>
    </Link>
  );
};

export default BillingGroupLink;
