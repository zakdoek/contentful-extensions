import React from 'react';
import PropTypes from 'prop-types';

import { createClient } from '@commercetools/sdk-client';
import { createAuthMiddlewareForClientCredentialsFlow } from '@commercetools/sdk-middleware-auth';
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http';
import { createRequestBuilder } from '@commercetools/api-request-builder';

import ProductCard from './product-card.js';

export class App extends React.Component {
  constructor(props) {
    super(props);

    const { instanceParameters, isSingle } = props;
    const value = props.extension.field.getValue();

    this.state = {
      fieldValue: isSingle ? value : [value],
      products: []
    };

    console.log(props);

    this.ctClient = createClient({
      // The order of the middlewares is important !!!
      middlewares: [
        createAuthMiddlewareForClientCredentialsFlow(
          {
            host: instanceParameters.authUri,
            projectKey: instanceParameters.projectKey,
            credentials: {
              clientId: instanceParameters.clientId,
              clientSecret: instanceParameters.clientSecret
            }
          },
          fetch
        ),
        createHttpMiddleware({ host: instanceParameters.apiUri }, fetch)
      ]
    });

    this.requestBuilder = createRequestBuilder({ projectKey: instanceParameters.projectKey });
  }

  componentDidMount() {
    const productQuery = this.requestBuilder.products.build();

    let productRequest = {
      uri: productQuery,
      method: 'GET'
    };

    this.ctClient.execute(productRequest).then(response => {
      if (response.body && response.body.results) {
        const products = response.body.results.map(item => {
          const priceObj = item['masterData']['current']['masterVariant']['prices'][0]['value'];
          let price = parseInt(priceObj['centAmount']);
          console.log(item);
          return {
            item,
            price
          };
        });

        this.setState({ products: products });
      }
    });
  }

  render() {
    const { isSingle } = this.props;

    return (
      <div>
        {this.state.products.map(product => (
          <ProductCard item={product.item} />
        ))}
      </div>
    );
  }
}

App.propTypes = {
  extension: PropTypes.object.isRequired,
  instanceParameters: PropTypes.shape({
    projectKey: PropTypes.string.isRequired,
    clientId: PropTypes.string.isRequired,
    clientSecret: PropTypes.string.isRequired,
    apiUri: PropTypes.string.isRequired,
    authUri: PropTypes.string.isRequired
  }).isRequired,
  isSingle: PropTypes.bool.isRequired
};
