const mongoose = require('mongoose');
const User = require('./models/User');
const Goal = require('./models/Goal');
const CheckIn = require('./models/CheckIn');

const seedData = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/goalsync');
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Goal.deleteMany({});
    await CheckIn.deleteMany({});
    console.log('Database cleared!');

    // Create HR Admin
    const hr = await User.create({
      name: 'HR Admin 1',
      email: 'hr1@goalsync.com',
      employeeId: 'HR1',
      password: 'hr1',
      role: 'Admin',
      department: 'HR'
    });

    // Create Managers
    const m1 = await User.create({
      name: 'Manager 1',
      email: 'm1@goalsync.com',
      employeeId: 'M1',
      password: 'm1',
      role: 'Manager',
      department: 'Engineering'
    });

    const m2 = await User.create({
      name: 'Manager 2',
      email: 'm2@goalsync.com',
      employeeId: 'M2',
      password: 'm2',
      role: 'Manager',
      department: 'Sales'
    });

    const m3 = await User.create({
      name: 'Manager 3',
      email: 'm3@goalsync.com',
      employeeId: 'M3',
      password: 'm3',
      role: 'Manager',
      department: 'Customer Support'
    });

    console.log('Managers seeded!');

    const employees = [];

    // Seeding Engineering team (e1 to e4 under m1)
    for (let i = 1; i <= 4; i++) {
      const emp = await User.create({
        name: `Employee ${i}`,
        email: `e${i}@goalsync.com`,
        employeeId: `E${i}`,
        password: `e${i}`,
        role: 'Employee',
        department: 'Engineering',
        managerId: m1._id
      });
      employees.push(emp);
    }

    // Seeding Product team (e5 to e7 under m1)
    for (let i = 5; i <= 7; i++) {
      const emp = await User.create({
        name: `Employee ${i}`,
        email: `e${i}@goalsync.com`,
        employeeId: `E${i}`,
        password: `e${i}`,
        role: 'Employee',
        department: 'Product',
        managerId: m1._id
      });
      employees.push(emp);
    }

    // Seeding Sales team (e8 to e10 under m2)
    for (let i = 8; i <= 10; i++) {
      const emp = await User.create({
        name: `Employee ${i}`,
        email: `e${i}@goalsync.com`,
        employeeId: `E${i}`,
        password: `e${i}`,
        role: 'Employee',
        department: 'Sales',
        managerId: m2._id
      });
      employees.push(emp);
    }

    // Seeding Marketing team (e11 to e13 under m2)
    for (let i = 11; i <= 13; i++) {
      const emp = await User.create({
        name: `Employee ${i}`,
        email: `e${i}@goalsync.com`,
        employeeId: `E${i}`,
        password: `e${i}`,
        role: 'Employee',
        department: 'Marketing',
        managerId: m2._id
      });
      employees.push(emp);
    }

    // Seeding Customer Support team (e14 to e16 under m3)
    for (let i = 14; i <= 16; i++) {
      const emp = await User.create({
        name: `Employee ${i}`,
        email: `e${i}@goalsync.com`,
        employeeId: `E${i}`,
        password: `e${i}`,
        role: 'Employee',
        department: 'Customer Support',
        managerId: m3._id
      });
      employees.push(emp);
    }

    console.log('16 Employees seeded across 5 departments!');

    // Let's seed some goals to make it functional initially:
    // e1 has 2 goals (1 active, 1 submitted response)
    const g1 = await Goal.create({
      title: 'Accelerate Core Microservices Refactoring',
      description: 'Migrate legacy monolith endpoints into high-performance microservices.',
      ownerId: employees[0]._id, // e1
      managerId: m1._id,
      type: 'Min',
      target: 10,
      uom: 'Endpoints',
      weightage: 50,
      status: 'Approved',
      assignedTeam: 'Engineering'
    });

    const g2 = await Goal.create({
      title: 'Deploy Automated Docker Pipelines',
      description: 'Construct custom GitHub action pipelines to build and register docker builds.',
      ownerId: employees[0]._id, // e1
      managerId: m1._id,
      type: 'Timeline',
      target: 1,
      uom: 'Pipeline',
      weightage: 50,
      status: 'Submitted',
      assignedTeam: 'Engineering',
      submissionText: 'I have successfully deployed the workflow and verified Docker builds run automatically.',
      submissionFile: 'docker_ci_workflow.yml',
      submissionDate: new Date()
    });

    // e2 has a goal
    const g3 = await Goal.create({
      title: 'Improve Frontend Coverage',
      description: 'Write Jest and React Testing Library tests for dashboard layouts.',
      ownerId: employees[1]._id, // e2
      managerId: m1._id,
      type: 'Min',
      target: 80,
      uom: '%',
      weightage: 100,
      status: 'Approved',
      assignedTeam: 'Engineering'
    });

    // m1 has a goal
    await Goal.create({
      title: 'Expand Engineering Core Roster',
      description: 'Successfully hire and onboard new core engineers.',
      ownerId: m1._id,
      managerId: hr._id,
      type: 'Min',
      target: 4,
      uom: 'Engineers',
      weightage: 100,
      status: 'Approved'
    });

    console.log('Demo Goals Seeded!');
    console.log('Database Seeding successfully complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
