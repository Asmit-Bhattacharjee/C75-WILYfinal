import * as React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Image, TextInput, KeyboardAvoidingView, ToastAndroid, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from "expo-permissions";
import db from '../config';
import * as firebase from 'firebase';


export default class BookTransactionScreen extends React.Component {
    constructor() {
        super();
        this.state = {
            hasCameraPermissions: null,
            scanned: false,
            scannedData: '',
            buttonState: 'normal',
            scannedStudentId: '',
            scannedBookId: '',
            transactionMessage: '',

        }
    }
    getCameraPermissions = async (id) => {
        const { status } = await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermissions: status === "granted",
            buttonState: id,
            scanned: false
        })
    }
    handleBarCodeScanned = async ({ type, data }) => {
        const { buttonState } = this.state
        if (buttonState === "BookId") {
            this.setState({
                scanned: true,
                scannedBookId: data,
                buttonState: 'normal'
            })
        }
        else if (buttonState === "StudentId") {
            this.setState({
                scanned: true,
                scannedStudentId: data,
                buttonState: 'normal'
            })
        }

    }
    initiateBookIssue = async () => {
        //adding a new collection to the db
        db.collection('transaction').add({
            "studentId": this.state.scannedStudentId,
            "bookId": this.state.scannedBookId,
            "date": firebase.firestore.Timestamp.now().toDate(),
            "transactionType": "Issue"
        })
        db.collection('books').doc(this.state.scannedBookId).update({
            "bookAvailability": false
        })
        db.collection('students').doc(this.state.scannedStudentId).update({
            "numberOfBooksIssued": firebase.firestore.FieldValue.increment(1)
        })
        Alert.alert("Book is Successfully Issued")
        this.setState({
            scannedBookId: '',
            scannedStudentId: ''
        })
    }

    initiateBookReturn = async () => {
        //adding a new collection to the db
        db.collection('transaction').add({
            "studentId": this.state.scannedStudentId,
            "bookId": this.state.scannedBookId,
            "date": firebase.firestore.Timestamp.now().toDate(),
            "transactionType": "Return"
        })
        db.collection('books').doc(this.state.scannedBookId).update({
            "bookAvailability": true
        })
        db.collection('students').doc(this.state.scannedStudentId).update({
            "numberOfBooksIssued": firebase.firestore.FieldValue.increment(-1)
        })
        Alert.alert("Book is Successfully Returned")
        this.setState({
            scannedBookId: '',
            scannedStudentId: ''
        })
    }
    checkBookEligibility = async () => {
        const bookRef = await db.collection("books").where("bookId", "==", this.state.scannedBookId).get();
        var transactionType = "";
        if (bookRef.docs.length == 0) {
            transactionType = false;
        } else {
            bookRef.docs.map(doc => {
                var book = doc.data();
                if (book.bookAvailability) {
                    transactionType = "Issue"
                } else {
                    transactionType = "Return"
                }
            })
        }
        return transactionType;
    }

    checkStudentEligibilityForBookIssue = async () => {
        const studentRef = await db.collection("students").where("studentId", "==", this.state.scannedStudentId).get();
        var isStudentEligible = "";
        if (studentRef.docs.length == 0) {
            isStudentEligible = false;
            this.setState({
                scannedBookId: '',
                scannedStudentId: ''
            })
            Alert.alert("The StudentId doesn't exists in the Database");
        } else {
            studentRef.docs.map(doc => {
                var student = doc.data();
                if (student.numberOfBooksIssued < 2) {
                    isStudentEligible = true;
                } else {
                    isStudentEligible = false;
                    Alert.alert("The Student has already Issued 2 books")
                    this.setState({
                        scannedBookId: '',
                        scannedStudentId: ''
                    })
                }
            })
        }
        return isStudentEligible;
    }

    checkStudentEligibilityForReturn = async () => {
        const transactionRef = await db.collection("transactions").where("bookId", "==", this.state.scannedBookId).get();
        var isStudentEligible = "";

        transactionRef.docs.map(doc => {
            var lastBookTransaction = doc.data();
            if (lastBookTransaction.studentId === this.state.scannedStudentId) {
                isStudentEligible = true;
            } else {
                isStudentEligible = false;
                Alert.alert("The book wasn't issued by this student")
                this.setState({
                    scannedBookId: '',
                    scannedStudentId: ''
                })
            }
        })
        return isStudentEligible;
    }

    handleTransaction = async () => {
        //Verify if the student is eligible for book issue or return or none.
        //Student Id exists in the database.
        //Issue:only if number of books issued<2.
        //Issue:verify book's availability.
        //Return:Last Transaction => Book issued by the same student.

        var transactionType = await this.checkBookEligibility();

        if (!transactionType) {
            Alert.alert("The Book Doesn't exist in Library Database")
            this.setState({
                scannedBookId: '',
                scannedStudentId: ''
            })
        } else if (transactionType === "Issue") {
            var isStudentEligible = await this.checkStudentEligibilityForBookIssue();
            if (isStudentEligible) {
                this.initiateBookIssue();
                Alert.alert("The Book is issued to the student successfully")
            }
        }
        else {
            var isStudentEligible = await this.checkStudentEligibilityForReturn();
            if (isStudentEligible) {
                this.initiateBookReturn();
                Alert.alert("Book Returned back to the Library Successfully")
            }
        }
    }
    render() {
        const hasCameraPermissions = this.state.hasCameraPermissions;
        const scanned = this.state.scanned;
        const buttonState = this.state.buttonState;

        if (buttonState !== "normal" && hasCameraPermissions) {
            return (
                <BarCodeScanner
                    onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
            )
        }
        else if (buttonState === "normal") {
            return (
                <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
                    <View>
                        <Image source={require("../assets/booklogo.jpeg")}
                            style={{ width: 200, height: 200 }}
                        />
                        <Text style={{ textAlign: 'center', fontSize: 30 }}>WILY</Text>
                    </View>

                    <View style={styles.inputView}>
                        <TextInput
                            style={styles.inputBox}
                            placeholder="Book ID"
                            onChangeText={text => this.setState({ scannedBookId: text })}
                            value={this.state.scannedBookId}
                        />
                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress={() => { this.getCameraPermissions("BookId") }}>
                            <Text style={styles.buttonText}>Scan</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputView}>
                        <TextInput
                            style={styles.inputBox}
                            placeholder="Student ID"
                            onChangeText={text => this.setState({ scannedStudentId: text })}
                            value={this.state.scannedStudentId}
                        />
                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress={() => { this.getCameraPermissions("StudentId") }}>
                            <Text style={styles.buttonText}>Scan</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.submitButton} onPress={async () => {
                        this.handleTransaction();
                        this.setState({
                            scannedBookId: '',
                            scannedStudentId: ''
                        })
                    }}>
                        <Text style={styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            )
        }
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanButton: {
        backgroundColor: 'red',
        width: 50,
        borderWidth: 1.5,
        borderLeftWidth: 0
    },
    buttonText: {
        fontSize: 20,
        color: 'white'
    },
    inputView: {
        flexDirection: 'row',
        margin: 20,
    },
    inputBox: {
        width: 200,
        height: 40,
        borderWidth: 1.5,
        borderRightWidth: 0,
        fontSize: 20
    },
    submitButton: {
        backgroundColor: '#FBC02D',
        width: 100,
        height: 50,
    },
    submitButtonText: {
        padding: 10,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: "bold",
        color: 'white'
    }
})