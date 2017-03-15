import { Meteor } from 'meteor/meteor';
import { Charities } from './charities';

const hasSubmission = {
  "RegistrationHistory.RemovalReason": { $eq: "" },
  "Submission": { $exists: true }
};

const hasReturns = {
  "RegistrationHistory.RemovalReason": { $eq: "" },
  "Returns": { $exists: true }
};

Meteor.methods({
  // getSearchContent() {
  //   let cursor = Charities.find({}, { fields: { _id: 1, CharityName: 1, RegisteredCharityNumber: 1 } })
  //   return cursor.fetch().map(function(el, idx, arr) {
  //     return {
  //       title: el.CharityName,
  //       description: (el.RegisteredCharityNumber).toString()
  //     }
  //   })
  // },

  searchTableData() {
    const withSubmissionsOnly = function withSubmissionsOnly(x) {
      return x.hasOwnProperty('Returns');
    };
    //charityName, city, gross income, employeesyees
    const res = Charities.find({hasReturns}, {
      fields: {
        CharityName: 1,
        RegisteredCharityNumber: 1,
        "Address.Postcode": 1,
        "Returns.Employees.NoEmployees": 1,
        "Returns.Resources.Incoming.Total": 1,
        RegistrationHistory: 1
      }
    }).fetch();
    // .filter(withSubmissionsOnly);

    function swapDateWithMonth(dateString) {

      let splitString = dateString.split("/");
      // let r;
      // r = 
      // console.log(`Converted string: ${r}, ${r.length}`);
      return splitString[1] + "/" + splitString[0] + "/" + splitString[2];
    };
    // return res[10];
    return res.map(x => {
      let RemovalReason = (((x.RegistrationHistory || [])[0] || {}).RemovalReason || ""),
        RegistrationDate = (((x.RegistrationHistory || [])[0] || {}).RegistrationDate || ""),
        Established,
        retIncoming = (((((x.Returns || [])[0] || {}).Resources || {}).Incoming || {}).Total || ""),
        subIncoming = (((x.Submission || []).slice(-1) || {}).GrossIncome || "");
        console.log(retIncoming, subIncoming);


      if (RegistrationDate === "") {
        Established = "";
      } else {
        // console.log("----------------");
        // console.log(`RegistrationDate: ${RegistrationDate}`)
        // let tmp = swapDateWithMonth(RegistrationDate);
        // console.log(new Date(tmp));
        Established = new Date(swapDateWithMonth(RegistrationDate));
      };;

      // console.log(`Established: ${Established.getFullYear()}`);

      return {
        Name: x.CharityName || "",
        Number: x.RegisteredCharityNumber || "",
        Established: Established.getFullYear(),
        Active: RemovalReason === "" ? "Yes" : "No",
        Incoming: retIncoming || subIncoming,
        Employees: ((((x.Returns || [])[0] || {}).Employees || {}).NoEmployees || "0"),
        Postcode: ((x.Address || {}).Postcode || ""),
      }
    });

  },
  topGrossIncome() {

    const withSubmissionsOnly = function withSubmissionsOnly(x) {
      return x.hasOwnProperty('Submission');
    };

    function grossIncomeToInt(x) {
      const submission = Array.from(x.Submission);
      let GrossIncome = "",
        lastSubmission;

      while (GrossIncome === "") {
        lastSubmission = submission.pop();
        if (lastSubmission.GrossIncome !== "") {
          GrossIncome = parseInt(lastSubmission.GrossIncome);
        };
      };

      // const lastSubmission = Array.from(x.Submission).pop();
      // const GrossIncome = lastSubmission.GrossIncome === '' ? 0 : parseInt(lastSubmission.GrossIncome);
      const grossIncomeResult = {
        CharityName: x.CharityName,
        RegisteredCharityNumber: x.RegisteredCharityNumber,
        GrossIncome: GrossIncome
      };
      return grossIncomeResult;
    };

    function sortByGrossIncome(a, b) {
      if (a.GrossIncome > b.GrossIncome) {
        return -1
      };
      if (a.GrossIncome < b.GrossIncome) {
        return 1
      };
      return 0;
    };

    const res = Charities.find(hasReturns, {
        fields: { CharityName: 1, RegisteredCharityNumber: 1, Submission: 1 }
      }).fetch()
      .filter(withSubmissionsOnly)
      .map(grossIncomeToInt)
      .sort(sortByGrossIncome);

    return res[0];
  },
  topTotalExpenditure() {

    function withSubmissionsOnly(x) {
      return x.hasOwnProperty('Submission');
    };

    function totalExpenditureToInt(x) {
      const submission = Array.from(x.Submission);
      let TotalExpenditure = "",
        lastSubmission;

      while (TotalExpenditure === "") {
        lastSubmission = submission.pop();
        if (lastSubmission.TotalExpenditure !== "") {
          TotalExpenditure = parseInt(lastSubmission.TotalExpenditure);
        };
      };

      const res = {
        CharityName: x.CharityName,
        RegisteredCharityNumber: x.RegisteredCharityNumber,
        TotalExpenditure: TotalExpenditure
      };
      // console.log(res);
      return res;
    };

    function sortByTotalExpenditure(a, b) {
      if (a.TotalExpenditure > b.TotalExpenditure) {
        return -1
      };
      if (a.TotalExpenditure < b.TotalExpenditure) {
        return 1
      };
      return 0;
    }

    const res = Charities.find(hasReturns, {
        fields: { CharityName: 1, RegisteredCharityNumber: 1, Submission: 1 }
      }).fetch()
      .filter(withSubmissionsOnly)
      .map(totalExpenditureToInt)
      .sort(sortByTotalExpenditure);
    return res[0];
  },
  topEmployer() {

    function employeeToInt(x) {
      const value = x.Returns[0].Employees.NoEmployees;
      const NoEmployees = value === "" ? 0 : parseInt(value);

      return {
        CharityName: x.CharityName,
        RegisteredCharityNumber: x.RegisteredCharityNumber,
        NoEmployees: NoEmployees
      };
    };

    function sortByNumEmployees(a, b) {
      if (a.NoEmployees > b.NoEmployees) {
        return -1
      };
      if (a.NoEmployees < b.NoEmployees) {
        return 1
      };
      return 0;
    }

    const res = Charities.find(hasReturns, {
        fields: { CharityName: 1, RegisteredCharityNumber: 1, Returns: 1 }

      }).fetch()
      .map(employeeToInt)
      .sort(sortByNumEmployees);
    // console.log(res);
    return res[0];
  },
  topVolunteerPlaces() {

    function volunteerToInt(x) {
      const value = x.Returns[0].Employees.NoVolunteers;
      const NoVolunteers = value === "" ? 0 : parseInt(value);

      return {
        CharityName: x.CharityName,
        RegisteredCharityNumber: x.RegisteredCharityNumber,
        NoVolunteers: NoVolunteers
      };
    };

    function sortByNumVolunteers(a, b) {
      if (a.NoVolunteers > b.NoVolunteers) {
        return -1
      };
      if (a.NoVolunteers < b.NoVolunteers) {
        return 1
      };
      return 0;
    }

    const res = Charities.find(hasReturns, {
        fields: { CharityName: 1, RegisteredCharityNumber: 1, Returns: 1 }

      }).fetch()
      .map(volunteerToInt)
      .sort(sortByNumVolunteers);
    // console.log(res);
    return res[0];
  }
});
