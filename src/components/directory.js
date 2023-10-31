import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import './directory.scss';
import Filter from './filter';

function formatTitle(title) {
  const titleParts = title.split(',')[0].trim().toLowerCase().split(' ');
  return titleParts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function DirectoryRow(props) {
  const formattedTitle = formatTitle(props.staff_member.title);

  return (
    <>
      {props.staff_member.expertise.length > 0 && (
        <tr className={`${props.college.key} ${props.department.key}`}>
          <td nowrap='true' className='staff-name'>
            <a href={props.staff_member.url} target='_blank' rel='noreferrer'>
              {props.staff_member.name}
            </a>
            <br />
            {formattedTitle} {/* Display the formatted title */}
          </td>
          <td className='college'>{props.college.name}</td>
          <td>{props.department.name}</td>
          <td>{props.staff_member.expertise.join(', ')}</td>
        </tr>
      )}
    </>
  );
}

export default class Directory extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      last_update: '',
      colleges: [],
    };
  }

  componentDidMount() {
    fetch('/expertise.json')
      .then((response) => response.json())
      .then((data) => {
        this.setState({ ...this.state, ...data });
      })
      .catch((err) => console.error(err));
  }

  render() {
    return (
      <Container>
        <Row>
          <Col xs={12}>
            <Filter data={this.state} style={{ marginTop: '20px' } />
            <div>Last Updated at: {this.state.last_update}</div>
            <table className='table'>
              <thead>
                <tr>
                  <th scope='col'>Name / Employee Title</th>
                  <th scope='col'>School</th>
                  <th scope='col'>Department</th>
                  <th scope='col'>Areas of Expertise</th>
                </tr>
              </thead>
              <tbody id='table-body'>
                {this.state.colleges.map((college) => {
                  return college['departments'].map((department) => {
                    return department['staff'].map((staff_member) => {
                      return (
                        <DirectoryRow
                          key={`${college.key}_${department.key}_${staff_member.name.toLowerCase().replaceAll(' ', '_')}`}
                          college={college}
                          department={department}
                          staff_member={staff_member}
                        />
                      );
                    });
                  });
                })}
              </tbody>
            </table>
          </Col>
        </Row>
      </Container>
    );
  }
}
