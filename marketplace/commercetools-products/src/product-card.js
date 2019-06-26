import React from 'react';
import PropTypes from 'prop-types';
import { EntryCard } from '@contentful/forma-36-react-components';

export default class ProductCard extends React.Component {
  render() {
    const item = this.props;
    console.log(item.item);
    return <EntryCard title={item.item.masterData.current} />;
  }
}
